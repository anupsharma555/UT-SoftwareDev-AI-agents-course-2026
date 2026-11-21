import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

import Home from './pages/Question/Home.jsx';
import QuestionDetail from './pages/Question/QuestionDetail.jsx';
import PostQuestion from './pages/Question/PostQuestion.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import Profile from './pages/Profile/Profile.jsx';
import Tags from './pages/Tags/Tags.jsx';
import BaseLayout from './layouts/BaseLayout.jsx';
import SideBarLayout from './layouts/SideBarLayout.jsx';
import { fetchBookmarkIds } from './reducers/bookmarkSlice.js';

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.user.userInfo?.token);

  // Load which questions are saved on app load and after login, so icons render filled right away.
  useEffect(() => {
    if (token) {
      dispatch(fetchBookmarkIds());
    }
  }, [token, dispatch]);

  return (
    <Router>
        <BaseLayout>
          <Routes>
            <Route element={<SideBarLayout><Outlet /></SideBarLayout>}>
              <Route path='/' element={<Home />} />
              <Route path='/question/:id' element={<QuestionDetail />} />
              <Route path='/ask' element={<PostQuestion />} />
              <Route path='/tags' element={<Tags />} />
              <Route path='/profile' element={<Profile />} />
            </Route>
            <Route path='/login' element={<Login />}/>
            <Route path='/register' element={<Register />}/>
          </Routes>
        </BaseLayout>
    </Router>
  )
}

export default App