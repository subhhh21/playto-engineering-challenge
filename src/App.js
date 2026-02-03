import React, { useState, useEffect } from 'react';
import './App.css';
import Comment from './components/Comment';

function App() {
  const [posts, setPosts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [user] = useState({ id: 1, name: "Suva", karma: 10 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fresh data fetch with cache-busting timestamp
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/posts/?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);

      const lRes = await fetch('http://127.0.0.1:8000/api/leaderboard/');
      const lData = await lRes.json();
      setLeaderboard(lData);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/posts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost, author: user.id })
      });
      if (res.ok) {
        setNewPost("");
        // Optimistic refresh
        setTimeout(fetchData, 400); 
      }
    } catch (err) { console.error("Post Submit Error:", err); }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/comments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, author: user.id, post: postId })
      });
      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        fetchData(); 
      }
    } catch (err) { console.error("Network Error:", err); }
  };

  const handleLike = (postId) => {
    // Instant UI update for better user experience
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p
    ));
    // Optional: Add backend call for permanent likes here
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar with subtle shadow and glass effect */}
      <nav className="bg-white/80 backdrop-blur-md border-b p-4 sticky top-0 z-50 shadow-sm flex justify-between items-center px-6">
        <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">PLAYTO.</h1>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700 hidden sm:block">Welcome, {user.name}! 👋</span>
          <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md shadow-indigo-100">
            {user.karma} PTS
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Create Post Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <textarea 
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 text-sm transition-all"
              placeholder="What's happening in your tech world?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <button 
              onClick={handlePostSubmit} 
              className="mt-3 bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-xs font-black float-right hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-50"
            >
              POST NOW
            </button>
            <div className="clear-both"></div>
          </div>

          {/* Feed List */}
          <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
            {posts.map(post => (
              <div key={post.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6 hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-indigo-500 mb-1 uppercase tracking-widest">By @{post.author_name || 'suva'}</p>
                <h2 className="text-lg font-bold text-slate-800 mb-4 leading-tight">{post.content}</h2>
                
                <div className="flex gap-6 mb-6 border-y py-3 text-slate-400">
                  <button onClick={() => handleLike(post.id)} className="text-xs font-black hover:text-red-500 transition-colors flex items-center gap-1">
                    ❤️ {post.likes_count || 0} Likes
                  </button>
                  <button className="text-xs font-black hover:text-indigo-600 flex items-center gap-1">
                    💬 {post.comments?.length || 0} Comments
                  </button>
                </div>

                {/* Comment Input Box */}
                <div className="mb-6 flex gap-2">
                  <input 
                    className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400" 
                    placeholder="Share your thoughts..." 
                    value={commentInputs[post.id] || ""} 
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                  />
                  <button 
                    onClick={() => handleCommentSubmit(post.id)} 
                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
                  >
                    SEND
                  </button>
                </div>

                <div className="space-y-4">
                  {post.comments?.map(c => (
                    <Comment key={c.id} comment={c} refreshData={fetchData} currentUser={user} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar / Leaderboard */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 sticky top-28 shadow-sm">
            <h3 className="font-black text-lg mb-6 flex items-center gap-2">🏆 Contributors</h3>
            <div className="space-y-3">
              {leaderboard.map((u, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <span className="font-bold text-sm text-slate-700">@{u.username}</span>
                  <span className="text-indigo-600 font-black text-xs uppercase">{u.karma || 0} PTS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;