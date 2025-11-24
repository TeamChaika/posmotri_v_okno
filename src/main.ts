import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

try {
  const app = createApp(App)
  
  app.config.errorHandler = (err, instance, info) => {
    console.error("Vue Error:", err)
    document.body.innerHTML += `<div style="color: red; position: fixed; top: 0; left: 0; background: white; z-index: 9999; padding: 20px;">
      <h3>Vue Error</h3>
      <pre>${err}</pre>
      <pre>${info}</pre>
    </div>`
  }

  app.mount('#app')
} catch (e) {
  console.error("Global Error:", e)
  document.body.innerHTML += `<div style="color: red; position: fixed; top: 0; left: 0; background: white; z-index: 9999; padding: 20px;">
    <h3>Global Error</h3>
    <pre>${e}</pre>
  </div>`
}

window.addEventListener('error', (event) => {
  document.body.innerHTML += `<div style="color: red; position: fixed; top: 50px; left: 0; background: white; z-index: 9999; padding: 20px;">
    <h3>Window Error</h3>
    <pre>${event.message}</pre>
  </div>`
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML += `<div style="color: red; position: fixed; top: 100px; left: 0; background: white; z-index: 9999; padding: 20px;">
    <h3>Promise Error</h3>
    <pre>${event.reason}</pre>
  </div>`
});
