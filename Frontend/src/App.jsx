import React from 'react'
import { Routes,Route,Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ReviewsPage from './pages/ReviewsPage.jsx'
import GithubSetupPage from './pages/GithubSetupPage.jsx'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './store/useAuthStore.js'
import { Loader } from 'lucide-react'
import { useEffect } from 'react'

const App = () => {
  const {authUser,checkAuth,isCheckingAuth} = useAuth()
  useEffect(() => {
    checkAuth();
  }, []);
  
  if((isCheckingAuth&&!authUser)){
    return(
      <div className=' flex justify-center items-center h-screen'>
        <Loader className="size-10 animate-spin" />
      </div>
    )
  }
  return (
    <div className='w-full h-full'>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/about' element={<AboutPage/>}/>
        <Route path='/login' element={!authUser?<LoginPage/>:<Navigate to='/chat'/>}/>
        <Route path='/signup' element={!authUser?<SignUpPage/>:<Navigate to='/chat'/>}/>
        <Route path='/chat' element={authUser?<ChatPage/>:<Navigate to='/login'/>}/>
        <Route path='/reviews' element={authUser?<ReviewsPage/>:<Navigate to='/login'/>}/>
        <Route path='/setup' element={authUser?<GithubSetupPage/>:<Navigate to='/login'/>}/>
      </Routes>
      <Toaster/>
    </div>
  )
}

export default App