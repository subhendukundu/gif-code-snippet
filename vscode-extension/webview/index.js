(function () {
    const vscode = acquireVsCodeApi();
    let timeOut = void 0;
    const canvasCollections = [];
    let isGifEnabled = true;

    vscode.postMessage({
        type: 'getAndUpdateCacheAndSettings'
    });

    const snippetNode = document.getElementById('snippet');
    const snippetContainerNode = document.getElementById('snippet-container');

    snippetContainerNode.style.opacity = '1';
    const oldState = vscode.getState();
    if (oldState && oldState.innerHTML) {
        snippetNode.innerHTML = oldState.innerHTML;
    }

    const getInitialHtml = fontFamily => {
        const cameraWithFlashEmoji = String.fromCodePoint(128248)
        const monoFontStack = `${fontFamily},SFMono-Regular,Consolas,DejaVu Sans Mono,Ubuntu Mono,Liberation Mono,Menlo,Courier,monospace`
        return `<meta charset="utf-8"><div style="color: #d8dee9;background-color: #2e3440; font-family: ${monoFontStack};font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;"> <div class="element-id-0"><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">0. Run command \`Create gif\`</span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span> </div> <div class="element-id-1"><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">1. Select some code</span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span></div> <div class="element-id-2"><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">2. Select gif or image from switch</span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span></div> <div class="element-id-3"><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">3. Click the download button</span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span> </div></div></div>`;
    };

    const serializeBlob = (blob, cb) => {
        const fileReader = new FileReader();

        fileReader.onload = () => {
            const bytes = new Uint8Array(fileReader.result);
            cb(Array.from(bytes).join(','));
        }

        function getBrightness(color) {
            const rgb = this.toRgb()
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        }

        fileReader.readAsArrayBuffer(blob)
    };

    function shoot(serializedBlob) {
        vscode.postMessage({
            type: 'shoot',
            data: {
                serializedBlob
            }
        });
    }

    function createGif(image) {
        vscode.postMessage({
            type: 'create',
            data: {
                image
            }
        });
    }

    function getBrightness(hexColor) {
        const rgb = parseInt(hexColor.slice(1), 16)
        const r = (rgb >> 16) & 0xff
        const g = (rgb >> 8) & 0xff
        const b = (rgb >> 0) & 0xff
        return (r * 299 + g * 587 + b * 114) / 1000
    }

    function isDark(hexColor) {
        return getBrightness(hexColor) < 128
    }

    function getSnippetBgColor(html) {
        const match = html.match(/background-color: (#[a-fA-F0-9]+)/)
        return match ? match[1] : undefined;
    }

    function updateEnvironment(snippetBgColor) {
        // update snippet bg color
        document.getElementById('snippet').style.backgroundColor = snippetBgColor;

        // update backdrop color
        if (isDark(snippetBgColor)) {
            snippetContainerNode.style.backgroundColor = '#f2f2f2';
        } else {
            snippetContainerNode.style.background = 'none';
        }
    }

    function getMinIndent(code) {
        const arr = code.split('\n');

        let minIndentCount = Number.MAX_VALUE;
        for (let i = 0; i < arr.length; i++) {
            const wsCount = arr[i].search(/\S/);
            if (wsCount !== -1) {
                if (wsCount < minIndentCount) {
                    minIndentCount = wsCount;
                }
            }
        }

        return minIndentCount;
    }

    function stripInitialIndent(html, indent) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const initialSpans = doc.querySelectorAll('div > div span:first-child');
        for (let i = 0; i < initialSpans.length; i++) {
            console.log(initialSpans[i].parentElement)
            initialSpans[i].parentElement.classList.add(`element-id-${i}`);
            initialSpans[i].textContent = initialSpans[i].textContent.slice(indent)
        }
        return doc.body.innerHTML
    }

    function renderGifImage(clientWidth, clientHeight) {
        if (window.gifshot) {
          window.gifshot.createGIF({
            'gifWidth': clientWidth,
            'gifHeight': clientHeight,
            'images': canvasCollections,
            'frameDuration': 10
          }, (obj) => {
            if(!obj.error) {
                console.log(obj.image);
                createGif(obj.image)
                canvasCollections.length = 0;
            }
          });
        }
    }

    document.addEventListener('paste', e => {
        const innerHTML = e.clipboardData.getData('text/html');

        console.log(innerHTML)

        const code = e.clipboardData.getData('text/plain');
        console.log(code)
        const minIndent = getMinIndent(code);
        console.log(minIndent)

        const snippetBgColor = getSnippetBgColor(innerHTML);
        if (snippetBgColor) {
            vscode.postMessage({
                type: 'updateBgColor',
                data: {
                    bgColor: snippetBgColor
                }
            });
            updateEnvironment(snippetBgColor)
        }

        if (minIndent !== 0) {
            console.log(stripInitialIndent(innerHTML, minIndent));
            snippetNode.innerHTML = stripInitialIndent(innerHTML, minIndent);
        } else {
            snippetNode.innerHTML = innerHTML;
        }

        vscode.setState({
            innerHTML
        });
        shootSnippet();
    });

    document.getElementById('typeOfMedia').addEventListener('click', () => {
        if(isGifEnabled) {
            clearInterval(timeOut);
            isGifEnabled = false;
        } else {
            shootSnippet();
            isGifEnabled = true;
        }
    });

    document.getElementById('download').addEventListener('click', () => {
        const nodeName = snippetNode.querySelector('div > div');
        const { children } = nodeName;
        const width = snippetNode.offsetWidth * 2;
        const height = snippetNode.offsetHeight * 2;
        const config = {
            width,
            height,
            style: {
                transform: 'scale(2)',
                'transform-origin': 'center',
                padding: 0,
                background: 'none'
            }
        };
        snippetNode.style.resize = 'none';
        snippetContainerNode.style.resize = 'none';
        if(isGifEnabled) {
            clearInterval(timeOut);
            function addImagesToCollection() {
                for (let i = 0; i < children.length; i++) {
                    children[i].classList.add('hide');
                }
                console.log(children);
                for (let i = 0; i < children.length; i++) {
                    setTimeout(() => {
                        children[i].classList.remove('hide');
                        domtoimage.toPng(snippetContainerNode, config)
                        .then((dataUrl) => {
                            canvasCollections.push(dataUrl);
                            if(i === children.length - 1) {
                                snippetNode.style.resize = '';
                                snippetContainerNode.style.resize = '';
                                renderGifImage(width, height);
                                shootSnippet()
                            }
                        })
                        .catch(function (error) {
                            console.error('oops, something went wrong!', error);
                        });
                    }, i);
                }
            }
            addImagesToCollection();
        } else {
            domtoimage.toBlob(snippetContainerNode, config).then(blob => {
                snippetNode.style.resize = '';
                snippetContainerNode.style.resize = '';
                serializeBlob(blob, serializedBlob => {
                    shoot(serializedBlob);
                });
            });
        }
    });

    function shootSnippet() {
        clearInterval(timeOut);
        const nodeName = snippetNode.querySelector('div > div');
        const { children } = nodeName;
        const { length } = children;

        function addImagesToCollection(isAddable) {
            for (let i = 0; i < children.length; i++) {
                children[i].classList.add('hide');
                console.log(children[i])
            }
            console.log(children);
            for (let i = 0; i < children.length; i++) {
                setTimeout(() => {
                    children[i].classList.remove('hide');
                    console.log(children[i], 'hide');
                }, i * 1000);
            }
        }
        addImagesToCollection(true);
        timeOut = setInterval(() => {
            addImagesToCollection();
        }, length * 1000);
        console.log(snippetNode);
    }

    window.addEventListener('message', e => {
        if (e) {
            if (e.data.type === 'init') {
                const {
                    fontFamily,
                    bgColor
                } = e.data

                const initialHtml = getInitialHtml(fontFamily)
                snippetNode.innerHTML = initialHtml
                console.log(initialHtml)
                vscode.setState({
                    innerHTML: initialHtml
                });

                shootSnippet();

                // update backdrop color, using bgColor from last pasted snippet
                // cannot deduce from initialHtml since it's always using Nord color
                if (isDark(bgColor)) {
                    snippetContainerNode.style.backgroundColor = '#f2f2f2'
                } else {
                    snippetContainerNode.style.background = 'none'
                }

            } else if (e.data.type === 'update') {
                console.log('paste')
                document.execCommand('paste')
            } else if (e.data.type === 'restore') {
                snippetNode.innerHTML = e.data.innerHTML;
                updateEnvironment(e.data.bgColor);
            } else if (e.data.type === 'restoreBgColor') {
                updateEnvironment(e.data.bgColor);
            } else if (e.data.type === 'updateSettings') {
                snippetNode.style.boxShadow = e.data.shadow;
                snippetContainerNode.style.backgroundColor = e.data.backgroundColor;
                if (e.data.ligature) {
                    snippetNode.style.fontVariantLigatures = 'normal'
                } else {
                    snippetNode.style.fontVariantLigatures = 'none'
                }
            }
        }
    })
})();