// ==UserScript==
// @name         HighLighter
// @namespace    http://tampermonkey.net/
// @version      0.4.1
// @description  当按住键盘的Ctrl键并使用鼠标选中部分网页文字时，将对应文字的背景高亮显示（例如明黄色）,当按住键盘的Alt键并使用鼠标左键点击部分网页文字时，删除对应高亮
// @author       Baxkiller with Bing AI & Copilot
// @match        *://*/*
// @grant        none
// ==/UserScript==

// 定义一个高亮颜色
var highlightColor = "yellow";
var highlight_cnt=0;
var highlight_limit=100;
var created_note = false;
// 创建用于暂存高亮内容的数组
var highlightContents = [];
var note;

// 定义和创建网页右侧便笺
class Note {
    constructor() {
        this.wrapper = document.createElement('div');
        this.wrapper.style.position = 'fixed';
        this.wrapper.style.right = '0';
        this.wrapper.style.top = '20%'; // 垂直居中
        this.wrapper.style.width = '200px';
        this.wrapper.style.height = '70vh'; // 自动高度
        this.wrapper.style.backgroundColor = 'rgba(240, 240, 240, 0.7)';  // 设置背景颜色为略微透明的灰色
        this.wrapper.style.padding = '10px';
        this.wrapper.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)'; // 添加阴影
        this.wrapper.style.borderRadius = '18px'; // 添加圆角
        this.wrapper.style.zIndex = '9999'; // 置于顶层

        this.note = document.createElement('textarea');
        this.note.style.overflow = 'auto';
        this.note.style.height = '88%'; // 最大高度60%的视口高度
        this.note.style.width = '100%'; // 占据全部宽度
        this.note.style.border = 'none';  // 无边框
        this.note.style.backgroundColor = 'transparent';  // 背景色透明
        this.note.style.outline = 'none';  // 去掉焦点时的边框
        this.note.style.resize = 'none';  // 用户不能调整大小

        this.wrapper.appendChild(this.note);

        document.body.appendChild(this.wrapper);

        this.addCopyButton('6%');
        this.addClearButton('6%');
    }

    addText(text) {
        // console.log(text);
        this.note.innerHTML += text + '\n';
    }

    addHightLightNode(node) {
        var text = node.textContent;
        var parent = node.parentNode;
        var markdownText = text;

        if (parent.tagName === 'H1') {
            markdownText = '# ' + text;
        } else if (parent.tagName === 'H2') {
            markdownText = '## ' + text;
        } else if (parent.tagName === 'H3') {
            markdownText = '### ' + text;
        } else if (parent.tagName === 'P') {
            markdownText = text;
        } else if (parent.tagName === 'SPAN') {
            markdownText = text;
        } else if (parent.tagName === 'A') {
            markdownText = '[' + text + '](' + parent.href + ')';
        } else if (parent.tagName === 'IMG') {
            markdownText = '![' + parent.alt + '](' + parent.src + ')';
        } else if (parent.tagName === 'LI') {
            markdownText = '- ' + text;
        } else if (parent.tagName === 'UL') {
            markdownText = '- ' + text;
        } else if (parent.tagName === 'OL') {
            markdownText = '1. ' + text;
        } else if (parent.tagName === 'B') {
            markdownText = '**' + text + '**';
        } else if (parent.tagName === 'I') {
            markdownText = '*' + text + '*';
        }

        this.addText(markdownText);
    }

    addCopyButton(h) {
        var copyButton = document.createElement('button');
        copyButton.innerText = 'Copy';
        copyButton.style.width = '100%'; // 与便笺同宽
        copyButton.style.height = h;
        copyButton.style.backgroundColor = '#007BFF'; // 蓝色背景
        copyButton.style.color = '#FFFFFF'; // 白色文字
        copyButton.style.border = 'none'; // 无边框
        copyButton.style.padding = '10px';
        copyButton.style.cursor = 'pointer'; // 鼠标悬停时变为手形
        copyButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)'; // 添加阴影
        copyButton.style.borderRadius = '18px'; // 添加圆角
        copyButton.style.zIndex = '9999';
        copyButton.id="copyButton_highLighter";

        this.copyButton = copyButton;
        var that = this;  // 保存this的值
        copyButton.onclick = () => {
            navigator.clipboard.writeText(that.note.value).then(() => {  // 使用that代替this
                console.log('复制成功');
                this.copyButton.innerText = 'Success';  // 修改按钮文本
                setTimeout(() => { this.copyButton.innerText = 'Copy'; }, 2000);  // 2秒后恢复原状
            }, function(err) {
                console.error('复制失败', err);
            });
        };

        this.wrapper.appendChild(this.copyButton);
    }

    addClearButton(h) {
        var clearButton = document.createElement('button');
        clearButton.innerText = 'Clear';
        clearButton.style.width = '100%'; // 占据一半宽度
        clearButton.style.height = h;
        clearButton.style.backgroundColor = '#dc3545'; // 红色背景
        clearButton.style.color = '#FFFFFF'; // 白色文字
        clearButton.style.border = 'none'; // 无边框
        clearButton.style.padding = '10px';
        clearButton.style.cursor = 'pointer'; // 鼠标悬停时变为手形
        clearButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)'; // 添加阴影
        clearButton.style.borderRadius = '18px'; // 添加圆角
        clearButton.style.zIndex = '9999'; 
        
        clearButton.onclick = () => {
            this.note.innerHTML = ''; // 清除所有文本
            this.wrapper.style.display = 'none'; // 隐藏便笺
            created_note = false;
        };
        this.wrapper.appendChild(clearButton);
    }
}

function highlightNode(node, startOffset, endOffset) {
    if (highlight_cnt > highlight_limit) {
        return false;
    }
    var highlight_block = document.createElement("highlight");
    highlight_block.style.backgroundColor = highlightColor;
    var nodeRange = document.createRange();
    nodeRange.setStart(node, startOffset !== undefined ? startOffset : 0);
    nodeRange.setEnd(node, endOffset !== undefined ? endOffset : node.nodeValue.length);
    nodeRange.surroundContents(highlight_block);

    if (!created_note) {
        note = new Note();
        created_note = true;
    }
    note.addHightLightNode(highlight_block);

    highlight_cnt++;
    return true;
}

function highlightRange(range) {
    var commonAncestor = range.commonAncestorContainer;
    var startNode = range.startContainer;
    var endNode = range.endContainer;

    var treeWalker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_TEXT);
    var currentNode = treeWalker.currentNode;

    var inRange = false;
    while (currentNode) {
        if (currentNode === startNode) {
            inRange = true;
        }
        if (inRange && currentNode.nodeValue.trim() !== '') {
            var startOffset = (currentNode === startNode) ? range.startOffset : 0;
            var endOffset = (currentNode === endNode) ? range.endOffset : currentNode.nodeValue.length;
            highlightContents.push({
                node: currentNode,
                startOffset: startOffset,
                endOffset: endOffset
            });
        }
        if (currentNode === endNode) {
            break;
        }
        currentNode = treeWalker.nextNode();
    }
}

function highlightSelection() {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        var isHighlighted = range.startContainer.parentNode.style.backgroundColor === highlightColor;
        if (isHighlighted) return;

        highlightRange(range);
        highlightContents.forEach(function (highlightContent) {
            highlightNode(highlightContent.node, highlightContent.startOffset, highlightContent.endOffset);
        });

        // 一次性选中内容的后面添加换行符
        if (highlightContents.length > 0) {
            note.addText('\n');
        }

        // 直接清空,防止溢出
        highlightContents.length = 0;
        highlightContents = [];

        selection.removeAllRanges();
    }
}

// 定义一个函数，用于取消高亮选中的文字
function unhighlightSelection(event) {
    // 获取鼠标点击的元素
    var element = event.target;
    var isHighlighted = element.tagName === "HIGHLIGHT" && element.style.backgroundColor === highlightColor;
    if (!isHighlighted){
        // console.log(element.tagName);
        // console.log(element.style.backgroundColor);
        return;
    }

    // 将higlilight元素替换为它textContent的内容
    var highlight_block = element;
    var text = highlight_block.textContent;
    var textNode = document.createTextNode(text);
    if (highlight_block.parentNode) {
        highlight_block.parentNode.replaceChild(textNode, highlight_block);
    }
}

// 监听键盘按下事件
document.addEventListener("keydown", function (event) {
    // 判断是否按下了Ctrl键或Alt键
    if (event.ctrlKey || event.altKey) {
        // 根据按下的键，选择对应的函数作为鼠标事件的监听器
        var handler = event.ctrlKey ? highlightSelection : unhighlightSelection;
        // 监听鼠标事件，调用对应函数
        if (event.ctrlKey) {
            // 如果按下了Ctrl键，则监听鼠标松开事件，用于高亮选中的文字
            document.addEventListener("mouseup", handler);
        } else {
            document.addEventListener("mousedown", handler);
        }
    }
});

// 监听键盘松开事件
document.addEventListener("keyup", function (event) {
    // 判断是否松开了Ctrl键或Shift键
    if (event.key === "Control" || event.key === "Alt") {
        // 根据松开的键，选择对应的函数作为鼠标事件的监听器
        var handler = event.key === "Control" ? highlightSelection : unhighlightSelection;
        // 移除鼠标事件的监听器
        if (event.key === "Control") {

            document.removeEventListener("mouseup", handler);
        } else {

            document.removeEventListener("mousedown", handler);
        }
    }
});
