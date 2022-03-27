const {
    app,
    BrowserWindow,
    desktopCapturer,
    ipcMain,
    dialog,
    globalShortcut
} = require('electron')
const path = require('path')

let win;

function createWindow() {

    win = new BrowserWindow({
        // 宽高位置
        // 应该获取屏幕的分辨率设置
        width: 1280,
        height: 800,
        x: 0,
        y: 0,
        // 不展示
        show: false,
        // 不展示chrome菜单等
        frame: false,
        // the window will always stay on top in all workspaces
        skipTaskbar: true,
        // Auto hide the menu bar
        autoHideMenuBar: true,
        // 可移动
        movable: false,
        // 可调整大小
        resizable: false,
        // 可以比屏幕大，不设置，覆盖不了顶部菜单
        enableLargerThanScreen: true,
        // Settings of web page's features.
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Sets whether the window should show always on top of other windows.
    win.setAlwaysOnTop(true, 'screen-saver')

    // 加载页面
    win.loadFile('index.html')

    // 打开Chrome调试
    // win.webContents.openDevTools()

    // 展示窗口
    ipcMain.on('show-window', () => {
        win.show()
    })

    // 隐藏窗口
    ipcMain.on('hide-window', () => {
        win.hide()
    })

    // 选择保存路径
    ipcMain.on('choose-path', () => {
        win.hide()
        let path = dialog.showSaveDialogSync({
            filters: [{
                name: 'Images',
                extensions: ['png', 'jpg', 'gif'],
            }],
        })
        if (path) {
            win.webContents.send('get-path', path)
        } else {
            win.show()
        }
    })
    return win
}

// Electron is initialized
app.whenReady().then(() => {
    // 创建window
    createWindow()
    // 注册快捷键
    registShortcut(capturer)
})


/**
 * 获取当前屏幕id，触发截屏
 */
function capturer() {
    desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: {
            // Set width or height to 0 when you do not need the thumbnails. 
            width: 0,
            height: 0
        }
    }).then(async sources => {
        console.log('on getSources !! ')
        // let buf = sources[1].toPNG()
        win.webContents.send('SET_SOURCE', sources[1].id)
    })
}

/**
 * 注册快捷键
 * @param {*} callback 回调
 */
function registShortcut(callback) {
    // Register a 'Command+Control+A' shortcut listener.
    const ret = globalShortcut.register('Command+Control+A', () => {
        console.log('Command+Control+A is pressed')
        callback()
    })

    if (!ret) {
        console.log('registration failed')
    }

    // Check whether a shortcut is registered.
    console.log('registration is success: ', globalShortcut.isRegistered('Command+Control+A'))
}

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        console.log('window-all-closed')
    }
})

// 激活时，隐藏时及点击图标
app.on('activate', function () {
    capturer()
    console.log('active')
})