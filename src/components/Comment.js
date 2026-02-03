import React, { useState } from 'react';

const Comment = ({ comment, refreshData, currentUser }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReply = async () => {
    if (!replyText.trim()) return;

    // FIX: IntegrityError ko rokne ke liye hum post ki ID nikaal rahe hain
    const postId = comment.post_id || comment.post;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/comments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyText, 
          author: currentUser.id, 
          post: postId, // Ab ye NULL nahi jayega
          parent: comment.id 
        })
      });

      if (res.ok) {
        setReplyText("");
        setShowReply(false);
        refreshData(); 
      } else {
        const errorData = await res.json();
        console.error("Reply Error:", errorData);
      }
    } catch (err) {
      console.error("Reply sending failed:", err);
    }
  };

  if (!comment) return null;

  return (
    <div className="thread-container border-l-2 border-slate-100 ml-2 md:ml-6 pl-4 mt-4 animate-fade-in">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
            {comment.author_name ? comment.author_name[0].toUpperCase() : 'S'}
          </div>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
            @{comment.author_name || 'suva'}
          </span>
        </div>
        
        <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
        
        <div className="flex items-center gap-4 mt-3">
          <button 
            onClick={() => setShowReply(!showReply)} 
            className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        </div>

        {showReply && (
          <div className="mt-4 flex gap-2 animate-slide-down">
            <input 
              className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 transition-all"
              placeholder="Write a professional reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            <button 
              onClick={handleReply} 
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              SEND
            </button>
          </div>
        )}
      </div>

      <div className="replies-wrapper">
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(r => (
              <Comment 
                key={r.id} 
                comment={r} 
                refreshData={refreshData} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;