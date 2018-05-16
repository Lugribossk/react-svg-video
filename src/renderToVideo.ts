import * as sharp from "sharp";
import * as Promise from "bluebird";
import {spawn} from "child_process";
import {VideoDetails} from "./types";

/*
https://medium.com/@brianshaler/on-the-fly-video-rendering-with-node-js-and-ffmpeg-165590314f2
https://trac.ffmpeg.org/wiki/Slideshow
https://stackoverflow.com/questions/19759138/error-using-ffmpeg-image2pipe-with-phantomjs-to-render-video-from-webpage-screen
https://stackoverflow.com/questions/40560255/ffmpeg-jpeg-stream-to-webm-only-creates-a-file-webm-with-1-frame-snapshot-or/40582299#40582299
https://stackoverflow.com/questions/37957994/how-to-create-a-video-from-image-buffers-using-fluent-ffmpeg
 */

export interface RenderProps {
    time: number;
    frame: number;
    width: number;
    height: number;
}

export const renderToVideo = ({width, height, fps, frames}: VideoDetails, output: string, render: (props: RenderProps) => string) => {
    // rgb32? argb?
    const args = `-f image2pipe -framerate ${fps} -y -hide_banner -pix_fmt yuva420p -i - ${output}`;
    const ffmpeg = spawn("c:\\temp\\ffmpeg-20180508-293a6e8-win64-static\\bin\\ffmpeg", args.split(" "));
    ffmpeg.stderr.pipe(process.stdout);

    const sendRemainingFramesToFfmpeg = (frame: number): Promise<void> => {
        if (frame % 100 === 0) {
            console.log(Math.floor(frame / frames* 100) + "%")
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
            ffmpeg.stdin.end();
        });
};
