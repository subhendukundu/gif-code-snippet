export default function ShouldRender(props) {
    return props.if ? (
        props.children
    ) : null;
}