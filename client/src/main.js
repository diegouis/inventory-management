import './styles/tokens.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import Inventory from './views/Inventory.vue'
import Orders from './views/Orders.vue'
import Demand from './views/Demand.vue'
import Spending from './views/Spending.vue'
import Reports from './views/Reports.vue'

// meta.titleKey is an i18n key the topbar resolves for the current page title
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard, meta: { titleKey: 'nav.overview' } },
    { path: '/inventory', component: Inventory, meta: { titleKey: 'nav.inventory' } },
    { path: '/orders', component: Orders, meta: { titleKey: 'nav.orders' } },
    { path: '/demand', component: Demand, meta: { titleKey: 'nav.demandForecast' } },
    { path: '/spending', component: Spending, meta: { titleKey: 'nav.finance' } },
    { path: '/reports', component: Reports, meta: { titleKey: 'nav.reports' } }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
