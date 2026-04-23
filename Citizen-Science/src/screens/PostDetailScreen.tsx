import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Keyboard, FlatList, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import TopNav from '../components/TopNav';
import { TAB_BAR_STYLE } from '../navigation/NavigationBar';
import Comments from '../components/Comments';
import LikeButton from '../components/LikeButton';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../util/token';
import { formatTimeAgo } from '../util/formatTime';
import { deletePost } from '../api/posts';
import { logActivity } from '../api/activity';
import Popup from '../components/Popup';

type RouteParams = {
  post?: any;
  comments?: any[];
  userId?: number;
};

const PostDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation: any = useNavigation();
  const { userToken, setUserToken } = useContext(AuthContext);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const currentUserId = decodedToken ? decodedToken.user_id : NaN;
  const userPermissions = decodedToken ? decodedToken.permissions : null;
  const userOrgId = decodedToken ? decodedToken.org_id : null;
  const userCanDeleteAllPosts = userPermissions ? userPermissions.delete_all_posts : false;

  const params = (route.params || {}) as RouteParams;
  const [post, setPost] = useState<any>(params.post || null);
  const [comments, setComments] = useState<any[]>(params.comments || []);
  const [commentText, setCommentText] = useState('');
  const [visibleDropdown, setVisibleDropdown] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [postPendingDelete, setPostPendingDelete] = useState<any | null>(null);

  useEffect(() => {
    // If navigation provided a fresh post via params, use it; otherwise you could fetch by id here
    if (route.params && (route.params as any).post) {
      setPost((route.params as any).post);
    }
    if (route.params && (route.params as any).comments) {
      setComments((route.params as any).comments);
    }
  }, [route.params]);

  // hide parent tab bar while this screen is focused, restore when unfocused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent && navigation.getParent();
      try {
        parent?.setOptions && parent.setOptions({ tabBarStyle: { display: 'none' } });
      } catch (e) {
        // ignore
      }
      return () => {
        try {
          // restore explicit tab bar style so size/padding remain consistent
          parent?.setOptions && parent.setOptions({ tabBarStyle: TAB_BAR_STYLE });
        } catch (e) {
          // ignore
        }
      };
    }, [navigation])
  );

  // previously hid parent tab bar here; removed to keep bottom nav visible

  // (previously hid parent tab bar here; removed so bottom nav remains visible)

  const handleBack = () => {
    const source = (route.params as any)?.source;
    if (source === 'Search') {
      // Navigate back to Search, preserving search state
      navigation.navigate('Search', { preserveSearch: true });
    } else if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const userCanDeletePost = (postToCheck: any) => {
    return (
      currentUserId === postToCheck.user_id ||
      userCanDeleteAllPosts ||
      (userOrgId && userOrgId === postToCheck.org_id && userPermissions?.delete_org_posts)
    );
  };

  const performDeletePost = async (postToDelete: any) => {
    if (!userCanDeletePost(postToDelete)) return;
    try {
      await deletePost(postToDelete.post_id, setUserToken);
      navigation.navigate('Community Home', { refreshPosts: Date.now() });
      await logActivity(currentUserId, `User deleted post with post id ${postToDelete.post_id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePost = (postToDelete: any) => {
    setVisibleDropdown(null);
    setPostPendingDelete(postToDelete);
    setDeleteConfirmVisible(true);
  };

  const confirmDeletePost = async () => {
    if (!postPendingDelete) return;
    setDeleteConfirmVisible(false);
    await performDeletePost(postPendingDelete);
    setPostPendingDelete(null);
  };

  const cancelDeletePost = () => {
    setDeleteConfirmVisible(false);
    setPostPendingDelete(null);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      // call API to create comment - reuse createComment if available
      const { createComment } = require('../api/comments');
      const created = await createComment(commentText, currentUserId, post.post_id, NaN);
      setComments((c) => [created, ...c]);
      setCommentText('');
      Keyboard.dismiss();
    } catch (e) {
      console.warn('Failed to post comment', e);
    }
  };

  if (!post) {
    return (
      <>
        <TopNav title="Post" showBack onBack={handleBack} />
        <SafeAreaView style={styles.container}>
          <View style={styles.empty}><Text>No post data</Text></View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      {/* Render TopNav outside SafeAreaView so the gradient/header matches Home */}
      <TopNav title="" showBack onBack={handleBack} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.post}>
            <View style={styles.headerRow}>

              {/* Profile image */}
              <Image
                source={{
                  uri: post?.user_avatar_url
                    ? `${process.env.EXPO_PUBLIC_API_URL}${post.user_avatar_url}`
                    : `https://t4.ftcdn.net/jpg/03/40/12/49/360_F_340124934_bz3pQTLrdFpH92ekknuaTHy8JuXgG7fi.jpg`
                }}
                style={styles.avatar}
                onError={(e) => {
                  e.currentTarget.setNativeProps({
                    src: [{ uri: 'https://t4.ftcdn.net/jpg/03/40/12/49/360_F_340124934_bz3pQTLrdFpH92ekknuaTHy8JuXgG7fi.jpg' }]
                  });
                }}
              />



              <View style={styles.headerTextContainer}>
                <Text style={styles.userName}>{post.userName}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
              </View>
              {userCanDeletePost(post) && (
                <TouchableOpacity
                  onPress={() => setVisibleDropdown(visibleDropdown === post.post_id.toString() ? null : post.post_id.toString())}
                  style={{ padding: 8 }}
                >
                  <MaterialIcons name="more-vert" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            {visibleDropdown === post.post_id.toString() && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  onPress={() => handleDeletePost(post)}
                  style={styles.dropdownItem}
                >
                  <MaterialIcons name="delete" size={16} color="#e11d48" />
                  <Text style={styles.dropdownItemText}>Delete post</Text>
                </TouchableOpacity>
              </View>
            )}

            {post.content ? <Text style={styles.postText}>{post.content}</Text> : null}

            {post.media && post.media.length > 0 && (() => {
              const images = post.media.filter((m: any) => m.media_type === 'Image');
              if (images.length === 0) return null;
              const imageWidth = Dimensions.get('window').width - 32;
              return (
                <View style={{ marginTop: 10, position: 'relative' }}>
                  <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={{ width: imageWidth }}
                    keyExtractor={(m: any) => m.media_id.toString()}
                    renderItem={({ item: m }: { item: any }) => {
                      const url = `${process.env.EXPO_PUBLIC_API_URL}${m.media_url}`;
                      return (
                        <Image
                          source={{ uri: url }}
                          style={{
                            width: imageWidth,
                            height: 250,
                            borderRadius: 12,
                            backgroundColor: '#e5e7eb',
                          }}
                          resizeMode="cover"
                        />
                      );
                    }}
                  />
                  {images.length > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6, gap: 4 }}>
                      {images.map((_: any, idx: number) => (
                        <View
                          key={idx}
                          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}

            {visibleDropdown === post.post_id.toString() && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setVisibleDropdown(null)}
                style={styles.dropdownBackdrop}
              />
            )}

            <View style={styles.commentButtonRow}>
              <LikeButton
                postId={post.post_id}
                user_id={currentUserId}
                initialLikesCount={post.likes_count}
                likedPost={post.user_liked}
                onToggle={(id, liked, likesCount) => {
                  // update local post state so UI reflects change immediately
                  setPost((p: any) => ({ ...(p || {}), user_liked: liked, likes_count: likesCount }));
                }}
              />
            </View>
          </View>

          {/* Comments header */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsHeaderText}>Comments</Text>
          </View>
          <View style={{ flex: 1, marginTop: 6 }}>
            <Comments
              comments={comments}
              postUserId={post.user_id}
              postId={post.post_id}
              userId={currentUserId}
              orgId={NaN}
              onAddComment={() => { }}
              onDeleteComment={() => { }}
              onLikeComment={() => { }}
              onUnlikeComment={() => { }}
              showInput={false}
            />
          </View>

          {/* Fixed bottom input */}
          <View style={styles.bottomInputWrap}>
            <View style={styles.inputPillFull}>
              <TextInput
                placeholder="Write a comment..."
                placeholderTextColor="#9CA3AF"
                style={styles.inputPillText}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={handlePostComment} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
      <Popup
        isVisible={deleteConfirmVisible}
        message="Delete this post? This cannot be undone."
        onClose={cancelDeletePost}
        buttons={[
          { label: 'Cancel', onPress: cancelDeletePost, backgroundColor: '#e5e7eb', labelColor: '#111827' },
          { label: 'Delete', onPress: confirmDeletePost, backgroundColor: '#e11d48' },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  post: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff1f2',
    borderRadius: 10,
    borderColor: '#fecdd3',
    borderWidth: 1,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#be123c',
    fontWeight: '600',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 8 },
  headerTextContainer: { justifyContent: 'center', flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  timestamp: { fontSize: 12, color: '#9CA3AF' },
  postText: { marginTop: 8, fontSize: 16, lineHeight: 22, color: '#111' },
  commentButtonRow: {
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  commentCountText: { color: '#6b7280', fontSize: 15 },
  commentsHeader: { backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 16 },
  commentsHeaderText: { fontWeight: '600', color: '#111', fontSize: 16 },
  bottomInputWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  inputPillFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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

export default PostDetailScreen;
