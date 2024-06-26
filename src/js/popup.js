
import yaml from 'js-yaml'

const editorsBlock = document.querySelector('[data-element="editors-block"]')
const fullScreen = document.querySelector('[data-element="caption__fullScreen"]')
const stars = document.querySelectorAll('.star')

if (fullScreen) {
  fullScreen.addEventListener('click', () => {
    const url = chrome.runtime.getURL("/html/fullScreen.html")
    chrome.tabs.create({ url })
    window.close()
  })
}

if (stars.length !== 0) {
  stars.forEach(star => {
    star.addEventListener('mouseover', handleMouseOver);
    star.addEventListener('mouseout', handleMouseOut);
    star.addEventListener('click', handleClick);
  });

  function handleClick(event) {
    const index = parseInt(event.currentTarget.getAttribute('data-index'));
    const footerLink = document.querySelector('.footer__link');
    const link = index <= 3 ? '\n' +
        'https://docs.google.com/forms/d/e/1FAIpQLSeiMiYzuB9W3kzXrBYhscp3agPnzX5O7W1TRHmmDnjxlFwbVg/viewform?usp=sf_link'
        :
        'https://chromewebstore.google.com/detail/yaml-to-json-converter/ljnpooaliebiknmmimdpdgahbeabjiln/reviews';
    footerLink.setAttribute('href', link);
  }

  function handleMouseOver(event) {
    const index = parseInt(event.currentTarget.getAttribute('data-index'));
    fillStars(index);
  }

  function handleMouseOut() {
    fillStars(0);
  }

  function fillStars(index) {
    stars.forEach(star => {
      const starIndex = parseInt(star.getAttribute('data-index'));
      const starFill = star.querySelector('.star-fill');
      if (starIndex <= index) {
        starFill.classList.add('visible');
      } else {
        starFill.classList.remove('visible');
      }
    });
  }
}


if (editorsBlock) setTimeout(editorsInit, 0)

function editorsInit() {
  const input = editorsBlock.querySelector('[data-element="input"]')
  const output = editorsBlock.querySelector('[data-element="output"]')
  const buttonLoad = editorsBlock.querySelector('[data-element="button-load"]')
  const inputLoad = editorsBlock.querySelector('[data-element="input-load"]')
  const buttonExport = editorsBlock.querySelector('[data-element="button-export"]')
  const buttonCopy = editorsBlock.querySelector('[data-element="button-copy"]')
  const headerTabs = editorsBlock.querySelectorAll('[data-element="header__tab" ]')
  const buttonReset = editorsBlock.querySelector('[data-element="button-reset"]')

  const editorFrame = editorsBlock.querySelectorAll('.editor-frame')[1]
  const editorInputBlock = editorsBlock.querySelector('.editor-input')
  let editorFrameStart = editorsBlock.querySelector('[data-element="editor-frame_start"]')
  const editorLine = editorsBlock.querySelector('[data-element="editor-line-output"]')
  let flug = 'YAML'

  lineNumbers(input)
  input.addEventListener('input', convertValue)
  buttonLoad.addEventListener('click', loadFile)
  buttonExport.addEventListener('click', exportFile)
  buttonCopy.addEventListener('click', copyFile)
  headerTabs.forEach(tab => {
    tab.addEventListener('click', toogleTab)
  })
  buttonReset.addEventListener('click', clearAll)

  function lineNumbers(block, mod = false, reset) {
    let editorLine = block.previousElementSibling
    let val = block.value;
    let numOfLines = 1;

    if (reset) {
      update()
    }

    if (mod === 'paste') {
      update()
    }

    if (block === input){
      input.addEventListener('input', update)
    }else {
      update()
    }


    function update () {
      val = block.value;

      let lineBreaks = val.match(/[\n\r]/g) || [];
      numOfLines = lineBreaks.length ? lineBreaks.length + 1 : 1;

      editorLine.innerHTML = ""
      for (var i = 0; i < numOfLines; i++) {

        var el = document.createElement('span');
        el.innerHTML = i + 1;
        editorLine.appendChild(el);
      }
    }
  }

  function convertValue () {
    if (input.value.length == 0) {
      checkedNullValue()
      return
    }

    function checkedNullValue () {
      removeErrorStyles()
      editorFrameStart.style.display = 'flex'
      editorFrame.style.overflow = 'hidden'
      editorLine.style.display = 'none'
      output.style.overflowX = 'hidden'
    }

    if(flug === 'YAML') {
      try{
        let result = yaml.load(input.value)
        if (result === null || result === undefined) {
          addErrorStyles()
          return
        }

        output.value = JSON.stringify(result, null, 2)
        output.addEventListener('input', lineNumbers(output))

        removeErrorStyles()
      } catch (err) {
        addErrorStyles()
      }
    }

    if(flug === 'JSON'){
      try{
        let json = JSON.parse(input.value)

        if (json === null || json === undefined) {
          addErrorStyles()
          return
        }

        output.value = yaml.dump(json)
        output.addEventListener('input', lineNumbers(output))
        removeErrorStyles()
      } catch (err) {
        addErrorStyles()
      }
    }

    function addErrorStyles () {
      editorLine.style.display = 'none'
      editorInputBlock.classList.add('editor-input_error')
      editorFrameStart.style.display = 'flex'
      editorFrameStart.innerText = 'Not a valid value'
      editorFrameStart.style.color = '#E04040'
      editorFrame.style.overflow = 'hidden'
      output.style.overflowX = 'hidden'
    }

  }

  function removeErrorStyles () {
    editorLine.style.display = 'flex'
    editorFrameStart.style.display = 'none'
    editorInputBlock.classList.remove('editor-input_error')
    editorFrameStart.innerText = 'Your result will be shown here'
    editorFrameStart.style.color = '#646878'
    editorFrame.style.overflow = 'auto'
    output.style.overflowX = 'auto'
  }

  function loadFile () {
    const editorInputBlock = editorsBlock.querySelector('.editor-input')
    inputLoad.click()
    inputLoad.addEventListener('change', () => {
      let file = inputLoad.files[0];
      let reader = new FileReader();

      reader.readAsText(file);

      reader.onload = () => {
        input.value = reader.result
        lineNumbers(input, 'paste')
        convertValue()
      };

      reader.onerror = () => {
        console.log('Error, not valide file')
      };
      inputLoad.value = ''
    })


  }

  function exportFile () {
    if (output.value !== '') {
      let content = output.value;

      var blob = new Blob([content], { type: "text/plain" });
      var url = URL.createObjectURL(blob);

      var a = document.createElement("a");
      a.href = url;

      if(flug === 'YAML'){
        a.download = "modify.json";
      }

      if(flug === 'JSON'){
        a.download = "modify.yaml";
      }

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
    }
  }

  function copyFile (e) {
    if (output.value === '') {
      return
    } else {
      buttonCopy.classList.add('button-copy_success')
      output.select()
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      setTimeout((e) => {
        buttonCopy.classList.remove('button-copy_success')
      }, 3000)
    }


  }

  function clearAll () {
    input.value = ''
    output.value = ''
    lineNumbers(input, false, 'reset')
    lineNumbers(output, false, 'reset')
    removeErrorStyles()
    editorFrameStart.style.display = 'flex'
    editorFrame.style.overflow = 'hidden'
    editorLine.style.display = 'none'
    output.style.overflowX = 'hidden'
  }

  function toogleTab (e) {
    let position = e.currentTarget.dataset.position
    let tab = e.currentTarget.dataset.role

    if(tab === 'json'){
      flug = position === 'input' ? 'JSON' : 'YAML'
      toogleClass(e)
      changeLoadPermission()
      clearAll()
      input.placeholder = `Paste your ${flug} here`
    }

    if(tab === 'yaml'){
      flug = position === 'input' ? 'YAML' : 'JSON'
      toogleClass(e)
      changeLoadPermission()
      clearAll()
      input.placeholder = `Paste your ${flug} here`
    }

    function toogleClass (e) {
      headerTabs.forEach(tab => tab.classList.remove('header__tab_active'))

      e.currentTarget.classList.add('header__tab_active')
      let otherTabArr = Array.from(headerTabs)
      let otherTab = otherTabArr.find(t => t.dataset.position !== position && t.dataset.role !== tab)
      otherTab.classList.add('header__tab_active')
    }

    function changeLoadPermission () {
      inputLoad.accept = `.${flug}`
    }
  }
}