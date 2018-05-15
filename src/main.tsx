import * as React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {renderToVideo} from "./renderToVideo";

class MySvg extends React.Component<{t: number}> {
    render() {
        return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
                <text x="50" y="50" fill="white">{this.props.t}</text>
            </svg>
        );
    }
}

renderToVideo(5, 100, "./target/test.mp4", t => renderToStaticMarkup(<MySvg t={t} />));
