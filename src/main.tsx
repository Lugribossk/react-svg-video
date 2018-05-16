import * as React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {RenderProps, renderToVideo} from "./renderToVideo";
import {getVideoDetails} from "./getVideoDetails";

class MySvg extends React.Component<RenderProps> {
    render() {
        const {width, height, time, frame} = this.props;
        return (
            <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" version="1.1">
                <text x="50" y="50" fill="white" style={{fontSize: 30}}>Timestamp: {time}</text>
                <text x="50" y="100" fill="white" style={{fontSize: 30}}>Frame: {frame}</text>
            </svg>
        );
    }
}

// renderToVideo(5, 100, "./target/test.mp4", t => renderToStaticMarkup(<MySvg t={t} />));

getVideoDetails("./target/90second.mp4")
    .then(details => {
        return renderToVideo({...details, frames: 100}, "./target/test.webm", props => renderToStaticMarkup(<MySvg {...props} />));
    });
