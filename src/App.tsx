import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Automations from './pages/Automations'
import AutomationBuilder from './pages/AutomationBuilder'
import Posts from './pages/Posts'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/automations/new" element={<AutomationBuilder />} />
            <Route path="/automations/:id/edit" element={<AutomationBuilder />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
