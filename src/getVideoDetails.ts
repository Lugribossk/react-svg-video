import {parseInt} from "lodash";
import {spawn} from "child_process";
import {VideoDetails} from "./types";
import * as Promise from "bluebird";

export const getVideoDetails = (path: string): Promise<VideoDetails> => {
    return new Promise(resolve => {
        const args = `-v quiet -print_format json -show_format -show_streams -hide_banner ${path}`;
        const ffprobe = spawn("c:\\temp\\ffmpeg-20180508-293a6e8-win64-static\\bin\\ffprobe", args.split(" "));

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
                fps: parseInt(output.streams[0].r_frame_rate)
            });
        });
    });
};

const merge = (f1: string, f2: string, output: string) => {
    const args = `-i ${f1} -i ${f2} -filter_complex "overlay" ${output}`;
    const ffmpeg = spawn("c:\\temp\\ffmpeg-20180508-293a6e8-win64-static\\bin\\ffmpeg", args.split(" "));
}