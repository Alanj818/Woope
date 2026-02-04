import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from "../api/comments";
import { Comment } from "../api/types";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface CommentsProps {
  comments: Comment[];
  postUserId: number;
  postId: number;
  userId: number;
  orgId: number | null;
  onAddComment: (postId: number, comment: Comment) => void;
  onDeleteComment: (postId: number, commentId: number) => void;
  onLikeComment: (commentId: number) => void;
  onUnlikeComment: (commentId: number) => void;
  showInput?: boolean;
  onRefresh?: () => Promise<void> | void;
}

const Comments: React.FC<CommentsProps> = ({
  comments = [],
  postUserId,
  postId,
  userId,
  orgId,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  onUnlikeComment,
  showInput = true,
  onRefresh,
}) => {
  const [commentsState, setCommentsState] = useState<Comment[]>(comments || []);
  const [newCommentText, setNewCommentText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // keep internal state in sync when parent passes new comments
  React.useEffect(() => {
    setCommentsState(comments || []);
  }, [comments]);

  const handleNewCommentSubmit = async () => {
    if (!newCommentText.trim()) return;
    try {
      const createdComment = await createComment(
        newCommentText,
        userId,
        postId,
        orgId
      );
      // show new comment immediately
      setCommentsState((prev) => [createdComment, ...prev]);
      onAddComment(postId, createdComment);
      setNewCommentText("");
    } catch (error) {
      console.error("Error creating comment:", error);
      Alert.alert("Error", "Failed to create comment.");
    }
  };

  const handleDeletePostComment = async (commentToDelete: Comment) => {
    if (userId === commentToDelete.user_id || userId === postUserId) {
      try {
        await deleteComment(commentToDelete.comment_id);
        setCommentsState((prev) => prev.filter((c) => c.comment_id !== commentToDelete.comment_id));
        onDeleteComment(postId, commentToDelete.comment_id);
      } catch (error) {
        console.error("Error deleting comment:", error);
        Alert.alert("Error", "Failed to delete comment.");
      }
    }
  };

  const toggleLike = async (comment: Comment) => {
    const index = commentsState.findIndex((c) => c.comment_id === comment.comment_id);
    if (index === -1) return;
    const updatedComment = { ...commentsState[index] };
    try {
      if (updatedComment.likedByUser) {
        await unlikeComment(updatedComment.comment_id);
        updatedComment.likedByUser = false;
        updatedComment.likes_count = Math.max(0, (updatedComment.likes_count || 1) - 1);
      } else {
        await likeComment(updatedComment.comment_id);
        updatedComment.likedByUser = true;
        updatedComment.likes_count = (updatedComment.likes_count || 0) + 1;
      }
      setCommentsState((state) => state.map((item, idx) => (idx === index ? updatedComment : item)));
      if (updatedComment.likedByUser) onLikeComment(updatedComment.comment_id);
      else onUnlikeComment(updatedComment.comment_id);
    } catch (error) {
      console.error("Error updating like status:", error);
      Alert.alert("Error", "Failed to update like status.");
    }
  };

  const renderComments = () => {
    return commentsState.map((comment) => (
      <View key={comment.comment_id} style={styles.commentRow}>
        <Image
          source={require('../../assets/defaultprofilepic.png')}
          style={styles.avatarCircle}
        />
        <View style={styles.commentBody}>
          <View style={styles.commentHeaderRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.author}>{comment.username}</Text>
              <Text style={styles.commentTimestamp}>{new Date(comment.created_at).toLocaleTimeString()}</Text>
            </View>
          </View>
          <Text style={styles.text}>{comment.content}</Text>
        </View>
      </View>
    ));
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const onRefreshInternal = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
      else {
        // try local fetch using api
        const { getComments } = require('../api/comments');
        const fresh = await getComments(postId);
        setCommentsState(fresh || []);
      }
    } catch (e) {
      console.warn('Failed to refresh comments', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefreshInternal} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {renderComments()}
        {showInput && (
          <View style={styles.inputContainer}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.inputPillText}
                value={newCommentText}
                onChangeText={setNewCommentText}
                placeholder="Write a comment..."
                onSubmitEditing={handleNewCommentSubmit}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={handleNewCommentSubmit} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 6,
  },
  comment: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  commentCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  author: {
  fontWeight: '600',
  fontSize: 16,
  },
  text: {
  fontSize: 16,
  marginBottom: 5,
  color: '#111',
  },
  bottomRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  likeSectionRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  likesCount: {
    marginLeft: 8,
    color: '#6b7280'
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  postTouch: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  postButton: {
    color: "#007BFF",
    fontWeight: "700",
    fontSize: 16,
  },
  commentRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    marginLeft: 0,
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  headerTextContainer: { justifyContent: 'center', alignItems: 'flex-start' },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
  },
  inputPillText: {
    flex: 1,
    paddingVertical: 6,
    color: '#111',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 18,
    marginLeft: 8,
  },
});

export default Comments;
