from rest_framework import viewsets, response, decorators, status, serializers # serializers import kiya yahan
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from .models import Post, Comment, User
from .serializers import PostSerializer, CommentSerializer

class PostViewSet(viewsets.ModelViewSet):
    # N+1 Optimization: prefetch_related comments aur unke replies ko ek saath uthata hai
    queryset = Post.objects.all().prefetch_related('comments__replies').order_by('-created_at')
    serializer_class = PostSerializer

    def perform_create(self, serializer):
        # SAFE UPDATE: Pehle ID=1 dhoondo (Suva), nahi toh jo pehla user mile usey author bana do
        author = User.objects.filter(id=1).first() or User.objects.first()
        if author:
            serializer.save(author=author)
        else:
            raise serializers.ValidationError({"detail": "Database mein koi user nahi mila. Please ek user create karein."})

class CommentViewSet(viewsets.ModelViewSet):
    # Comments ko bhi order kar dete hain taaki latest pehle dikhe
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        author = User.objects.filter(id=1).first() or User.objects.first()
        if author:
            serializer.save(author=author)
        else:
            raise serializers.ValidationError({"detail": "User not found."})

@decorators.api_view(['GET'])
def leaderboard(request):
    time_threshold = timezone.now() - timedelta(hours=24)
    
    # User activity pichle 24 ghante ki check ho rahi hai
    # p_karma: Post likes (5 pts), c_karma: Comment likes (1 pt)
    users = User.objects.annotate(
        p_karma=Count('posts__post_likes', filter=Q(posts__post_likes__created_at__gte=time_threshold)),
        c_karma=Count('comment__comment_likes', filter=Q(comment__comment_likes__created_at__gte=time_threshold))
    )
    
    leaderboard_data = []
    for u in users:
        total_score = (u.p_karma * 5) + (u.c_karma * 1)
        if total_score > 0:
            leaderboard_data.append({
                'username': u.username,
                'karma': total_score
            })
            
    # Top 5 performers filter sorted by karma
    sorted_data = sorted(leaderboard_data, key=lambda x: x['karma'], reverse=True)[:5]
    return response.Response(sorted_data)