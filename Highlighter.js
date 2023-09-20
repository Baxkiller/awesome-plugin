// ==UserScript==
// @name         HighLighter
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  当按住键盘的Ctrl键并使用鼠标选中部分网页文字时，将对应文字的背景高亮显示（例如明黄色）,当按住键盘的Shift键并使用鼠标左键点击部分网页文字时，删除对应高亮
// @author       Baxkiller with Bing AI
// @match        *://*/*
// @grant        none
// ==/UserScript==

// 定义一个高亮颜色
var highlightColor = "yellow";

// 定义一个函数，用于高亮选中的文字
function highlightSelection() {
    // 获取选中的文字范围
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
        // 获取选中的文字的第一个范围
        var range = selection.getRangeAt(0);
        // 判断选中的文字是否已经高亮
        var isHighlighted = range.startContainer.parentNode.style.backgroundColor === highlightColor;
        // 如果已经高亮，则不做任何操作，直接返回
        if (isHighlighted) return;
        // 创建一个span元素，用于包裹选中的文字
        var highlight_block = document.createElement("highlight");
        // 设置span元素的背景颜色为高亮颜色
        highlight_block.style.backgroundColor = highlightColor;
        // 将选中的文字替换为span元素
        range.surroundContents(highlight_block);
        // 清除选中状态
        selection.removeAllRanges();
    }
}

// 定义一个函数，用于取消高亮选中的文字
function unhighlightSelection(event) {
    // 获取鼠标点击的元素
    var element = event.target;
    var isHighlighted = element.tagName === "HIGHLIGHT" && element.style.backgroundColor === highlightColor;
    if (!isHighlighted){
        console.log(element.tagName);
        console.log(element.style.backgroundColor);
        return;
    }

    // 将higlilight元素替换为它textContent的内容
    var highlight_block = element;
    var text = highlight_block.textContent;
    var textNode = document.createTextNode(text);
    highlight_block.parentNode.replaceChild(textNode, highlight_block);
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
