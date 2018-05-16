import * as sharp from "sharp";
import * as Promise from "bluebird";
import {spawn} from "child_process";
import * as fs from "fs";
import * as _ from "lodash";

/*
https://medium.com/@brianshaler/on-the-fly-video-rendering-with-node-js-and-ffmpeg-165590314f2
https://trac.ffmpeg.org/wiki/Slideshow
https://stackoverflow.com/questions/19759138/error-using-ffmpeg-image2pipe-with-phantomjs-to-render-video-from-webpage-screen
https://stackoverflow.com/questions/40560255/ffmpeg-jpeg-stream-to-webm-only-creates-a-file-webm-with-1-frame-snapshot-or/40582299#40582299
https://stackoverflow.com/questions/37957994/how-to-create-a-video-from-image-buffers-using-fluent-ffmpeg
https://superuser.com/questions/1044453/extract-alpha-channel-from-webm-video/1116905
 */

const FF_PATH = "C:\\Temp\\ffmpeg-4.0-win64-static\\bin\\";

export interface VideoDetails {
    width: number;
    height: number;
    frames: number;
    fps: number;
    duration: number;
}

export interface RenderProps {
    time: number;
    frame: number;
    width: number;
    height: number;
}

export const renderToVideo = ({width, height, fps, frames}: VideoDetails, output: string, render: (props: RenderProps) => string): Promise<void> => {
    console.log(`Rendering overlay frames for ${width}x${height} video with ${frames} frames at ${fps} fps...`);
    return new Promise(resolve => {
        const args = `-f image2pipe -framerate ${fps} -y -hide_banner -r ${fps} -pix_fmt yuva420p -i - ${output}`;
        const ffmpeg = spawn(FF_PATH + "ffmpeg", args.split(" "));
        // ffmpeg.stderr.pipe(process.stdout);

        ffmpeg.on("close", () => {
            resolve();
        });

        const sendRemainingFramesToFfmpeg = (frame: number): Promise<void> => {
            if (frame % 50 === 0) {
                console.log(Math.floor(frame / frames * 100) + "%")
            }
            const time = frame / fps * 1000;
            const svg = render({time: time, frame: frame, width: width, height: height});

            return Promise.resolve(sharp(new Buffer(svg))
                .resize(width, height)
                .png()
                .toBuffer())
                .then(buf => {
                    return Promise.fromCallback(cb => {
                        ffmpeg.stdin.write(buf, cb);
                    });
                })
                .then(() => {
                    if (frame < frames) {
                        return sendRemainingFramesToFfmpeg(frame + 1);
                    }
                    return Promise.resolve();
                })
        };

        return sendRemainingFramesToFfmpeg(0)
            .then(() => {
                console.log("Finalizing overlay video...");
                ffmpeg.stdin.end();
            });
    })
};

export const getVideoDetails = (path: string): Promise<VideoDetails> => {
    return new Promise(resolve => {
        const args = `-v quiet -print_format json -show_format -show_streams -hide_banner ${path}`;
        const ffprobe = spawn(FF_PATH + "ffprobe", args.split(" "));

        let rawOutput = "";
        ffprobe.stdout.on("data", data => {
            rawOutput += data;
        });

        ffprobe.on("close", () => {
            const output = JSON.parse(rawOutput);

            resolve({
                width: output.streams[0].width,
                height: output.streams[0].height,
                frames: parseInt(output.streams[0].nb_frames),
                fps: parseInt(output.streams[0].r_frame_rate),
                duration: parseInt(output.streams[0].duration) * 1000
            });
        });
    });
};

export const mergeVideos = ({frames}: VideoDetails, f1: string, f2: string, output: string) => {
    console.log("Adding overlay to input...");
    return new Promise(resolve => {
        // Vcodec has to be set to this value before the input file for transparency to be read correctly.
        const args = `-i ${f1} -vcodec libvpx-vp9 -i ${f2} -y -hide_banner -filter_complex overlay ${output}`;
        const ffmpeg = spawn(FF_PATH + "ffmpeg", args.split(" "));
        ffmpeg.stderr.pipe(process.stdout);

        ffmpeg.stderr.on("data", rawData => {
            const data = rawData.toString();
            if (_.startsWith(data, "frame=")) {
                const frame = _.parseInt(data.substr(6, 11));
                console.log(Math.floor(frame / frames * 100) + "%")
            }
        });

        ffmpeg.on("close", () => {
            resolve();
        });
    });
};

export const addOverlay = (input: string, render: (props: RenderProps) => string) => {
    const overlay = "./target/temp.webm";
    const start = Date.now();
    let details: VideoDetails;
    getVideoDetails(input)
        .then(d => {
            details = d;
            return renderToVideo(details, overlay, render);
        })
        .then(() => {
            return mergeVideos(details, input, overlay, `${input.substr(0, input.length - 4)}-overlay.mp4`)
        })
        .then(() => {
            fs.unlinkSync(overlay);
            console.log(`Done in ${(Date.now() - start) / 1000} seconds!`);
        });
};
