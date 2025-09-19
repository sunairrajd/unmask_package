console.log("Hello from Edge extension content script!");


// content.js
const panel = document.createElement("div");
panel.innerText = "My Extension Panel";
panel.style = `
  position: fixed;
  bottom: 0;
  right: 0;
  background: #222;
  color: #fff;
  padding: 10px;
  z-index: 9999;
  font-family: sans-serif;
`;
document.body.appendChild(panel);
