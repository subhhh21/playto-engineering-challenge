from rest_framework import serializers
from .models import Post, Comment
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class CommentSerializer(serializers.ModelSerializer):
    # author_name humein sirf dikhane ke liye chahiye (Read Only)
    author_name = serializers.ReadOnlyField(source='author.username')
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        # FIX: 'post', 'author', aur 'parent' ko yahan add karna ZAROORI hai taaki data save ho sake
        fields = ['id', 'post', 'author', 'author_name', 'content', 'parent', 'replies', 'created_at']
        
        # Isse GET request mein author ki poori details milengi, 
        # par POST request mein hum sirf ID bhej payenge. Best of both worlds!
        extra_kwargs = {
            'author': {'required': False}, # Agar view handle kar raha hai toh
        }

    def get_replies(self, obj):
        if obj.replies.exists():
            # Recursion chalti rahegi
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    comments = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'author_name', 'content', 'likes_count', 'comments', 'created_at']

    def get_comments(self, obj):
        # Sirf top-level comments uthao
        top_level_comments = obj.comments.filter(parent=None)
        return CommentSerializer(top_level_comments, many=True).data

    def get_likes_count(self, obj):
        # Agar post_likes related_name hai toh ye count dega
        try:
            return obj.post_likes.count()
        except:
            return 0