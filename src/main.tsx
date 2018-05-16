import * as React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {addOverlay, RenderProps} from "./renderToVideo";

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

addOverlay("./target/90second.mp4", props => renderToStaticMarkup(<MySvg {...props} />));
