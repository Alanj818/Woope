import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  Image,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
  Button,
  SafeAreaView,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { AuthContext } from "../util/AuthContext";
import { jwtDecode } from "jwt-decode";
import "core-js/stable/atob";
import { AccessToken, deleteToken } from "../util/token";
import { logoutUser } from "../api/auth";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import Comments from "../components/Comments";
import LikeButton from "../components/LikeButton";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Weather from "../components/weather";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TopNav from '../components/TopNav';
import {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostLikes,
  getUserLikedPosts,
} from "../api/posts";
import { getPostById } from "../api/posts";
import {
  createComment,
  deleteComment,
  updateComment,
  likeComment,
  unlikeComment,
  getComments,
} from "../api/comments";
import { PdfFile, Post, Comment, PostWithUsername } from "../api/types";
// WelcomeBanner removed to avoid the pale blue top strip
import FixedSwitch from "../components/FixedSwitch";
import { logActivity } from "../api/activity";
const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { userToken, setUserToken } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const userPermissions = decodedToken
    ? (decodedToken?.permissions)
    : null;
  const userCanDeleteAllPosts = userPermissions
    ? userPermissions.delete_all_posts
    : false;
  const userCanEditAllPosts = userPermissions
    ? userPermissions.edit_all_posts
    : false;
  const userName = decodedToken
    ? decodedToken.firstName + " " + decodedToken.lastName
    : null;
  const userOrgId = decodedToken ? decodedToken.org_id : null;
  const userOrgName = decodedToken ? decodedToken.org_name : null;
  const userId = decodedToken ? decodedToken.user_id : NaN;
  const [postAsOrganization, setPostAsOrganization] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postText, setPostText] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [posts, setPosts] = useState<PostWithUsername[]>([]);
  const [error, setError] = useState("");
  const [postPdfs, setPostPdfs] = useState<PdfFile[]>([]);
  const [isImageViewVisible, setImageViewVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [selectedPost, setSelectedPost] = useState<PostWithUsername | null>(
    null
  );
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [commentsMap, setCommentsMap] = useState<CommentsMap>({});
  const [visibleDropdown, setVisibleDropdown] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [modalY] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const postTextInputRef = useRef<TextInput>(null);
  const navigation: any = useNavigation();

  // Helper to navigate using the top-most navigator so nested/sibling routes are reachable
  const navigateToTop = (name: string, params?: any) => {
    // Walk up the navigator tree and call navigate on the first parent that declares the route name
    try {
      let nav: any = navigation as any;
      while (nav) {
        try {
          const state = nav.getState && nav.getState();
          const names: string[] = state && state.routeNames ? state.routeNames : [];
          if (names && names.includes(name)) {
            nav.navigate(name, params);
            return;
          }
        } catch (e) {
          // ignore and continue
        }

        const parent = nav.getParent && nav.getParent();
        if (!parent) break;
        nav = parent;
      }
    } catch (e) {
      // ignore
    }

    // As a last resort, attempt nested navigation via the 'Home' tab (common case), then fallback to current
    try {
      (navigation as any).navigate('Home', { screen: name, params });
      return;
    } catch (e) {
      // fallback to current navigation
      (navigation as any).navigate(name, params);
    }
  };

  // Guarded click handler for post items to avoid crashing in navigator resolution
  const handlePostPress = (item: PostWithUsername) => {
    try {
      // try to navigate to PostDetail safely
      navigateToTop('PostDetail', { post: item, comments: commentsMap[item.post_id] || [], userId });
    } catch (err) {
      console.warn('Failed to navigate to PostDetail:', err);
      try {
        // fallback: navigate using current navigation
        (navigation as any).navigate('PostDetail', { post: item, comments: commentsMap[item.post_id] || [], userId });
      } catch (e) {
        console.warn('Fallback navigate also failed:', e);
      }
    }
  };

  interface CommentsMap {
    [key: number]: Comment[];
  }

  useEffect(() => {
    fetchPosts();
    logActivity(userId, `Navigated to Home Screen`)
  }, []);

  // enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      // @ts-ignore
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // focus the post input and animate layout when composer opens
  useEffect(() => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {
      // ignore if not available
    }

    if (isPosting) {
      // small delay to ensure layout is applied before focusing
      setTimeout(() => {
        postTextInputRef.current?.focus();
      }, 80);
    }
  }, [isPosting]);


  const fetchPosts = async () => {
    try {
      let postsList = await getAllPosts(userId, setUserToken);
      postsList = postsList.filter((post: PostWithUsername) => {
        return post.is_active;
      });
      setPosts(postsList);
      const commentsMap: CommentsMap = {};
      for (const post of postsList) {
        const postComments = await getComments(post.post_id);
        commentsMap[post.post_id] = postComments;
      }
      setCommentsMap(commentsMap);
    } catch (error) {
      console.error(error);
      setError("Failed to fetch posts.");
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
    await logActivity(userId, `Refreshed post feed.`)
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uris = result.assets.map((asset) => asset.uri);
      setPostImages((prevImages) => [...prevImages, ...uris]);
    }
  };

  const pickPdf = async () => {
    try {
      if (postPdfs.length < 10) {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
          multiple: true,
        });

        if (!result.canceled && result.assets) {
          const newPdfFiles = result.assets.map((asset) => ({
            uri: asset.uri,
            name: asset.name || "Unknown Name",
          }));

          setPostPdfs((prev) => [...prev, ...newPdfFiles]);
        } else {
          console.log("No PDF was selected.");
        }
      } else {
        Alert.alert(
          "Limit Reached",
          "You can only select up to ten PDF files."
        );
      }
    } catch (error) {
      console.error("Error picking PDFs:", error);
    }
  };

  const handleOpenPdf = async (pdfUri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri);
      } else {
        alert("Sharing is not available");
      }
    } catch (error) {
      alert("An error occurred while trying to share the PDF.");
      console.error(error);
    }
  };

  const handleImagePress = (uri: string) => {
    setSelectedImageUri(uri);
    setImageViewVisible(true);
  };

  const toggleCommentsModal = (post?: PostWithUsername) => {
    setSelectedPost(post || null);
    setCommentsModalVisible(!commentsModalVisible);
    logActivity(userId, `Toggled comments modal to ${!commentsModalVisible}`)
  };

  const togglePostAsOrg = () => {
    setPostAsOrganization(!postAsOrganization);
    logActivity(userId, `Toggled posting as organization to ${!postAsOrganization}`)
  };

  const handleAddComment = (postId: number, newComment: Comment) => {
    setPosts((posts) =>
      posts.map((post) => {
        if (post.post_id === postId) {
          const updatedComments = post.comments
            ? [...post.comments, newComment]
            : [newComment];
          return { ...post, comments: updatedComments };
        }
        return post;
      })
    );
    fetchPosts();
    logActivity(userId, `Added comment to post with id ${postId}`)
  };

  const handleDeleteComment = (postId: number, commentId: number) => {
    fetchPosts();
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      const response = await likeComment(commentId);
      await logActivity(userId, `Liked comment with id ${commentId}`)
      fetchPosts();
    } catch (error) {
      console.error(error);
      setError("Failed to like post. Please try again.");
    }
  };

  const handleUnlikeComment = async (commentId: number) => {
    try {
      unlikeComment(commentId);
      await logActivity(userId, `Unliked comment with id ${commentId}`)
      fetchPosts();
    } catch (error) {
      console.error(error);
      setError("Failed to unlike post. Please try again.");
    }
  };

  const startEditingPost = (postId: number) => {
    const postToEdit = posts.find((post) => post.post_id === postId);
    if (postToEdit) {
      console.log("Editing post:", postToEdit);
      setPostText(postToEdit.content || "");
      setPostImages(postToEdit.image || []);
      setPostPdfs(postToEdit.pdfs || []);

      setIsEditing(true);
      setEditingPostId(postId);
      setVisibleDropdown(null);
      if (postTextInputRef.current) {
        postTextInputRef.current.focus();
      }
    } else {
      console.log("No post found with ID:", postId);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPostId || !postText.trim()) {
      alert("Post text cannot be empty.");
      return;
    }

    try {
      try {
        await getPostById(editingPostId, setUserToken);
      } catch (err) {
        console.error('Post lookup failed before update:', err);
        setError('Post not found. It may have been deleted.');
        setIsEditing(false);
        setEditingPostId(null);
        setPostText('');
        return;
      }

      const updatedPost = await updatePost(editingPostId, postText, setUserToken); // Adjust parameters as needed
      await logActivity(userId, `User edited post with id ${editingPostId}`);
      fetchPosts();

      // Reset the form and editing state
      setIsEditing(false);
      setEditingPostId(null);
      setPostText("");
      setPostImages([]);
      setPostPdfs([]);
      setIsPosting(false);
    } catch (error) {
  console.error("Failed to update the post:", error);
    }
  };

  const handleCreatePost = async () => {
    setError("");
    if (!postText.trim()) {
      setError("Please provide text for your post.");
      return;
    } else if (userId === null) {
      setError("Please login to post.");
      return;
    }
    try {
      const postOrgId = postAsOrganization ? userOrgId : NaN;
      await createPost(Number(userId), postOrgId, postText, setUserToken);
      await logActivity(userId, `User created new post with text: "${postText}"`)
      fetchPosts();

      // Clear the form
      setPostText("");
      setPostImages([]);
      setPostPdfs([]);
      setIsPosting(false);
    } catch (error) {
      console.error(error);
      setError("Failed to create post. Please try again.");
    }
  };

  const handleDeletePost = async (postToDelete: PostWithUsername) => {
    setVisibleDropdown(null);
    if (userCanDeletePost(postToDelete)) {
      try {
        deletePost(postToDelete.post_id, setUserToken);
        await logActivity(userId, `User deleted post with post id ${postToDelete.post_id}`)
        setPosts((currentPosts) =>
          currentPosts.filter((post) => post.post_id !== postToDelete.post_id)
        );
      } catch (error) {
        console.error(error);
        setError("Failed to delete post. Please try again.");
      } finally {
        fetchPosts();
      }
    }
  };

  const userCanModifyPost = (post: PostWithUsername) => {
    return (
      userId === post.user_id ||
      userCanDeletePost(post) ||
      userCanEditPost(post)
    );
  };

  const userCanDeletePost = (post: PostWithUsername) => {
    return (
      userId === post.user_id ||
      userCanDeleteAllPosts ||
      (userOrgId &&
        userOrgId === post.org_id &&
        userPermissions.delete_org_posts)
    );
  };

  const userCanEditPost = (post: PostWithUsername) => {
    return (
      userId === post.user_id ||
      userCanEditAllPosts ||
      (userOrgId && userOrgId === post.org_id && userPermissions.edit_org_posts)
    );
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [
        null,
        {
          dy: modalY,
        },
      ],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (e, gestureState) => {
      if (gestureState.dy > 100) {
        toggleCommentsModal();
      } else {
        Animated.spring(modalY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const modalStyle = {
    transform: [
      {
        translateY: modalY.interpolate({
          inputRange: [0, 100],
          outputRange: [0, 100],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
    <>
      <TopNav title="Home" />
      <SafeAreaView style={[styles.flexContainer, { backgroundColor: '#ffffff' }]}>
        {userPermissions.create_org_posts && userOrgId && (
          <FixedSwitch
            onValueChange={togglePostAsOrg}
            value={postAsOrganization}
          ></FixedSwitch>
        )}
        {data && <Text>{JSON.stringify(data, null, 2)}</Text>}
        <KeyboardAwareFlatList
          style={{ backgroundColor: '#ffffff' }}
          data={posts}
          keyExtractor={(item) => item.post_id.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[{ paddingBottom: insets.bottom + 10, backgroundColor: '#ffffff' }]}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handlePostPress(item)}>
              <View style={styles.post}>
              <View style={styles.headerRow}>
                <Image
                  source={{
                    uri:
                      (item as any)?.user_avatar_url ||
                      "https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.userName}>{item.userName}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              {item.content && <Text style={styles.postText}>{item.content}</Text>}

              <View style={styles.commentButton}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="comment" size={18} color="#007AFF" />
                  <Text style={{ color: "#6b7280", marginLeft: 6, marginRight: 8, fontSize: 15 }}>
                    {(commentsMap[item.post_id] || []).length}
                  </Text>
                </View>
                <LikeButton
                  postId={item.post_id}
                  user_id={userId}
                  initialLikesCount={item.likes_count}
                  likedPost={item.user_liked}
                  onToggle={(id, liked, likesCount) => {
                    setPosts((current) => current.map((p) => p.post_id === id ? { ...p, user_liked: liked, likes_count: likesCount } : p));
                    // if modal is open and selectedPost matches, update it too
                    if (selectedPost && selectedPost.post_id === id) {
                      setSelectedPost({ ...selectedPost, user_liked: liked, likes_count: likesCount } as any);
                    }
                  }}
                />
              </View>
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <>
              <Weather />
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => setIsPosting(true)}
                activeOpacity={0.92}
              >
                <View style={styles.listCardInner}>
                  {!isPosting ? (
                    <>
                      <Text style={styles.listCardText}>What's on your mind?</Text>
                    </>
                  ) : (
                    <View style={{ width: '100%' }}>
                      <TextInput
                        ref={postTextInputRef}
                        style={[styles.input, { marginBottom: 8 }]}
                        placeholder="What's on your mind?"
                        placeholderTextColor="#0D2538"
                        value={postText}
                        onChangeText={setPostText}
                        multiline
                        numberOfLines={4}
                      />
                      <View style={styles.iconsContainer}>
                        <TouchableOpacity onPress={pickImage}>
                          <Text>🖼️</Text>
                        </TouchableOpacity>
                        {postImages.map((uri, index) => (
                          <View key={index}>
                            <Text style={styles.previewLabel}>Image {index + 1}</Text>
                          </View>
                        ))}
                        <TouchableOpacity onPress={pickPdf}>
                          <Text>📄</Text>
                        </TouchableOpacity>
                        {postPdfs.map((pdf, index) => (
                          <View key={index}>
                            <Text style={styles.previewLabel}>
                              PDF {index + 1}: {pdf.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {postImages.map((uri, index) => (
                        <Image
                          key={index}
                          source={{ uri }}
                          style={styles.previewImage}
                        />
                      ))}
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity
                          style={[styles.postButtonSmall, { backgroundColor: '#ccc', marginRight: 8 }]}
                          onPress={() => {
                            setIsPosting(false);
                            setPostText('');
                            setPostImages([]);
                            setPostPdfs([]);
                            setIsEditing(false);
                            setEditingPostId(null);
                          }}
                        >
                          <Text style={[styles.postButtonTextSmall, { color: '#333' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.postButtonSmall}
                          onPress={isEditing ? handleUpdatePost : handleCreatePost}
                        >
                          <Text style={styles.postButtonTextSmall}>{isEditing ? 'UPDATE' : 'POST'}</Text>
                        </TouchableOpacity>
                      </View>
                      {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </>
          }
          showsVerticalScrollIndicator={false}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={isImageViewVisible}
          onRequestClose={() => {
            setImageViewVisible(!isImageViewVisible);
          }}
        >
          <View style={styles.centeredView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageViewVisible(false)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.fullScreenImage}
            />
          </View>
        </Modal>
        <Modal
          visible={commentsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => toggleCommentsModal()}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              {/* Use TopNav as the modal header so the post view matches list format */}
              {selectedPost && (
                <>
                  <TopNav title="" showBack={true} onBack={() => toggleCommentsModal()} />
                  <View style={{ padding: 16, backgroundColor: '#fff' }}>
                    <View style={styles.headerRow}>
                      <Image
                        source={{ uri: (selectedPost as any).user_avatar_url || 'https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png' }}
                        style={styles.avatar}
                      />
                      <View style={styles.headerTextContainer}>
                        <Text style={styles.userName}>{selectedPost.userName}</Text>
                        <Text style={styles.timestamp}>{
                          (() => {
                            const raw = (selectedPost as any).created_at ?? (selectedPost as any).timestamp ?? '';
                            try {
                              if (!raw) return '';
                              const d = new Date(raw);
                              if (isNaN(d.getTime())) return '';
                              return d.toLocaleTimeString();
                            } catch (e) {
                              return '';
                            }
                          })()
                        }</Text>
                      </View>
                    </View>

                    {selectedPost.content && <Text style={styles.postText}>{selectedPost.content}</Text>}

                    <View style={[styles.commentButton, { marginTop: 12 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="comment" size={18} color="#007AFF" />
                        <Text style={{ color: "#6b7280", marginLeft: 6, marginRight: 8, fontSize: 15 }}>
                          {(commentsMap[selectedPost.post_id] || []).length}
                        </Text>
                      </View>
                      <LikeButton
                        postId={selectedPost.post_id}
                        user_id={userId}
                        initialLikesCount={selectedPost.likes_count}
                        likedPost={(selectedPost as any).user_liked ?? selectedPost.likedPost}
                        onToggle={(id, liked, likesCount) => {
                          setPosts((current) => current.map((p) => p.post_id === id ? { ...p, user_liked: liked, likes_count: likesCount } : p));
                          setSelectedPost({ ...selectedPost, user_liked: liked, likes_count: likesCount } as any);
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Comments
                        comments={commentsMap[selectedPost.post_id] || []}
                        postUserId={selectedPost.user_id}
                        postId={selectedPost.post_id}
                        userId={userId}
                        orgId={postAsOrganization ? userOrgId : NaN}
                        onAddComment={handleAddComment}
                        onDeleteComment={handleDeleteComment}
                        onLikeComment={handleLikeComment}
                        onUnlikeComment={handleUnlikeComment}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  paddingHorizontal: 22,
  paddingTop: 0,
  paddingBottom: 22,
  backgroundColor: '#ffffff',
  },
  postBox: {
    backgroundColor: "#B4D7EE",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginHorizontal: 10,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#E7F3FD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 6,
  },
  postBoxInner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#D1E3FA",
  },
  postBoxText: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    textAlign: "center",
  },
  inputContainer: {
  width: "90%",
  alignSelf: "center",
  paddingHorizontal: 12,
  paddingVertical: 16,
  borderRadius: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    marginTop: 10,
  },
  input: {
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: 10,
  padding: 12,
  width: "100%",
  marginBottom: 10,
  fontSize: 18,
  color: '#0D2538',
  backgroundColor: '#FFFFFF',
  },
  editInput: {
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 8,
    fontSize: 16,
    color: '#1c1e21',
    backgroundColor: '#FFFFFF',
  },
  orgSwitch: {
    alignSelf: "flex-end",
  },
  previewImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 4 / 3,
  borderRadius: 8,
    marginBottom: 10,
  },
  postButton: {
  backgroundColor: "#007AFF",
  borderRadius: 16,
  marginTop: 8,
  width: wp("26%"),
  alignSelf: "flex-end",
  paddingVertical: hp("1.2%"),
  paddingHorizontal: wp("6%"),
  },
  postButtonText: {
  color: "#FFFFFF",
  textAlign: "center",
  fontSize: 15,
  },
  postButtonSmall: {
    backgroundColor: "#007AFF",
  borderRadius: 14,
  marginTop: 4,
  minWidth: wp("24%"),
  alignSelf: "flex-end",
  paddingVertical: hp("1.15%"),
  paddingHorizontal: wp("6%"),
  alignItems: 'center',
  justifyContent: 'center',
  },
  postButtonTextSmall: {
    color: "#FFFFFF",
    textAlign: "center",
  fontSize: 14,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  post: {
  backgroundColor: "#fff",
  paddingVertical: 16,
  paddingHorizontal: 12,
  alignSelf: "stretch",
  width: "100%",
  marginBottom: 0,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
  },
  postText: {
  marginBottom: 4,
  color: "#1f2937",
  fontSize: 16,
  lineHeight: 24,
  /* align post text with the username/timestamp (avatar width 44 + avatar marginRight 6 + headerTextContainer marginLeft 6 = 56) */
  marginLeft: 56,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
  avatar: {
  width: 44,
  height: 44,
  borderRadius: 22,
  marginBottom: 0,
  marginRight: 6,
  },
  pdfAttachedText: {
    marginTop: 10,
    color: "#007AFF",
    fontWeight: "bold",
  },
  pdfItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  pdfName: {
    marginLeft: 10,
  },
  previewLabel: {
    color: '#0D2538',
    fontSize: 14,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  imageItem: {
    width: "30%",
    aspectRatio: 1,
    margin: "1%",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  fullWidthImage: {
    width: Dimensions.get("window").width,
    height: 400,
    aspectRatio: 1,
    resizeMode: "contain",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    width: Dimensions.get("window").width,
    alignItems: "center",
    justifyContent: "center",
    resizeMode: "contain",
  },
  fullScreenImage: {
    width: "90%",
    height: "80%",
    resizeMode: "contain",
  },
  commentButton: {
  marginTop: 2,
  paddingVertical: 2,
  paddingHorizontal: 4,
  borderRadius: 5,
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "flex-end",
  width: '100%',
  },
  centeredViews: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 6,
  },
  header: {
    alignItems: 'flex-start',
    height: 76,
    paddingTop: 16,
    paddingHorizontal: 16,
    width: '100%',
  marginBottom: 0,
  },
  headerInner: {
    alignItems: 'center',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  headingWrapper: {
    height: 44,
    width: 180,
    justifyContent: 'center'
  },
  heading: {
    height: 28,
    justifyContent: 'center'
  },
  textWrapper: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 28,
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 9999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  icon: {
    height: 20,
    width: 20,
  },
  headerTextContainer: {
  marginLeft: 6,
    justifyContent: "center",
  },
  userName: {
  fontSize: 16,
  marginBottom: 4,
  fontWeight: '600',
  },
  timestamp: {
  fontSize: 12,
  color: "#9CA3AF",
  },
  dropdownIcon: {
    padding: 10,
    fontSize: 20,
    color: "#007AFF",
    position: "absolute",
    top: 10,
    right: 20,
    zIndex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 40,
    right: 10,
    backgroundColor: "#E7F6FF",
    borderRadius: 5,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },

  dropdownItem: {
    padding: 8,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  dropdownItems: {
    padding: 8,
    fontSize: 14,
    color: "#ff0000",
    fontWeight: "500",
  },
  logoutButton: {
    padding: 5,
    backgroundColor: "lightblue",
    borderRadius: 5,
    alignSelf: "flex-start",
    marginTop: -20,
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 35,
    paddingTop: 120,
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCEFFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAccent: {
    width: 6,
    backgroundColor: '#4A90E2',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 12,
    height: '100%'
  },
  listCardText: {
    fontSize: 18,
    color: '#0D2538',
    textAlign: 'left',
    flex: 1,
    paddingLeft: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.997 }],
  },
  listCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  chevron: {
    color: '#4A90E2',
    fontSize: 22,
    paddingLeft: 8,
  },
});
export default HomeScreen;