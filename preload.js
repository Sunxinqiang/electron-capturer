// In the preload script.
const { ipcRenderer } = require('electron')
const fs = require('fs')

let $canvas;
let $downloadBtn;
let $cancelBtn;


// dom加载完成
window.addEventListener('DOMContentLoaded', () => {
    $canvas = document.getElementById('canvas')
    $downloadBtn = document.getElementById('downloadBtn')
    $cancelBtn = document.getElementById('cancelBtn')

    // 下载按钮点击
    $downloadBtn.addEventListener('click', () => {
        // 选择路径
        ipcRenderer.send('choose-path')
        // 获取到路径后，下载
        ipcRenderer.on('get-path', (e, path) => {
            if (!path) { return }
            download(path, $canvas.toDataURL(), () => {
                ipcRenderer.send('hide-window')
            })
        })
    })

    // 取消按钮
    $cancelBtn.addEventListener('click', () => {
        ipcRenderer.send('hide-window')
    })
})

// 接收到 屏幕id
ipcRenderer.on('SET_SOURCE', async (event, sourceId) => {
    try {
        // 浏览器api，获取当前屏幕视频流
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    minWidth: 1280,
                    // maxWidth: 1280,
                    minHeight: 800,
                    // maxHeight: 800,
                },
            }
        })
        handleStream(stream)
    } catch (e) {
        handleError(e)
    }
})

/**
 * 处理视频流
 * video加载视频流，渲染到canvas上，最后获取canvas的dataUrl下载文件
 * @param {*} stream
 */
function handleStream(stream) {

    // Create hidden video tag
    let video = document.createElement('video')
    video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;'
    // Event connected to stream

    video.onloadedmetadata = () => {
        // Set video ORIGINAL height (screenshot)
        video.style.height = video.videoHeight + 'px' // videoHeight
        video.style.width = video.videoWidth + 'px' // videoWidth

        let load = false
        video.addEventListener("timeupdate",() => {
            if (video.currentTime > 0) {
                if (load) {
                    return
                }
                load = true

                drawImage(video)
    
                // Remove hidden video tag
                video.remove()
    
                try {
                    stream.getTracks()[0].stop()
                } catch (e) {
                    // nothing
                }
                ipcRenderer.send('show-window')
            }
        })

        video.play()
    }
    video.srcObject = stream
    document.body.appendChild(video)
}

function handleError(e) {
    console.log(e)
}


/**
 * 下载文件
 * @param {*} path 
 * @param {*} dataUrl 
 * @param {*} callback 
 */
function download (path, dataUrl, callback) {
    fs.writeFile(path, new Buffer(dataUrl.replace('data:image/png;base64,', ''), 'base64'), callback)
}


/**
 * 渲染canvas
 * @param {*} video
 */
function drawImage (video) {
    $canvas.width = video.videoWidth
    $canvas.height = video.videoHeight
    let ctx = $canvas.getContext('2d')
    // Draw video on $canvas
    ctx.drawImage(video, 0, 0, $canvas.width, $canvas.height)
}
