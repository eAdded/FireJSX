let count = 0;

export default (chunkFunc, {
    ssr = true, placeHolder = <div suppressHydrationWarning={true}></div>, onError = (e) => {
        console.error("Error while lazy loading ");
        throw new Error(e);
    }
} = {}) => {
    let id = `FireJSX_LAZY_${count++}`;
    let props;
    let setChild;

    async function starter() {
        try {
            const chunk = await chunkFunc();
            if (FireJSX.isSSR && ssr)
                document.getElementById(id).outerHTML = window.ReactDOMServer.renderToString(
                    React.createElement(chunk.default, props)
                );
            else
                setChild(React.createElement(chunk.default, {
                    ...props,
                    suppressHydrationWarning: true
                }, props.children))
        } catch (e) {
            onError(e)
        }
    }

    if (FireJSX.isSSR && ssr)
        FireJSX.lazyPromises.push(starter)
    else
        starter()

    return function (_props) {
        const [child, _setChild] = React.useState(FireJSX.isSSR ? <div id={id}/> : placeHolder);
        setChild = _setChild;
        props = _props;
        return child
    }
}