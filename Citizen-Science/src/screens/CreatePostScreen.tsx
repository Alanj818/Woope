import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Image, SafeAreaView, } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createPostWithMedia, getAllTags, setPostTag } from '../api/posts';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopNav from '../components/TopNav';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../util/token';
import { logActivity } from '../api/activity';
import { fetchAPI } from '../api/fetch';

interface PdfFile {
  uri: string;
  name: string;
}



const CreatePostScreen = () => {
  const navigation: any = useNavigation();
  const { userToken, setUserToken } = useContext(AuthContext);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const userId = decodedToken ? decodedToken.user_id : NaN;
  const userOrgId = decodedToken ? decodedToken.org_id : null;
  const userName = decodedToken ? decodedToken.firstName + " " + decodedToken.lastName : null;

  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const MAX_IMAGES = 4
  const [postPdfs, setPostPdfs] = useState<PdfFile[]>([]);
  const [error, setError] = useState('');
   const [userAvatar, setUserAvatar] = useState<string | null>(null); 
  const postTextInputRef = useRef<TextInput>(null);

  const [tagItems, setTagItems] = useState([
    { label: 'General', value: 'General' },
    { label: 'Environment', value: 'Environment' },
    { label: 'Event', value: 'Event' },
    { label: 'Workshop', value: 'Workshop' },
    { label: 'Hazard', value: 'Hazard' },
    { label: 'Mutual Aid', value: 'Mutual Aid' },
  ]);

  const tagStyles: Record<string, { backgroundColor: string; textColor: string }> = {
    General: { backgroundColor: '#E8F7EC', textColor: '#218A4A' },
    Environment: { backgroundColor: '#E7F0FF', textColor: '#2F6FEB' },
    Event: { backgroundColor: '#EDE2FF', textColor: '#8A3FFC' },
    Workshop: { backgroundColor: '#FFF0DC', textColor: '#B86A00' },
    Hazard: { backgroundColor: '#FCE3E3', textColor: '#D93025' },
    'Mutual Aid': { backgroundColor: '#E6F8F4', textColor: '#117A65' },

  };


  useEffect(() => {
    const fetchAvatar = async () => {
    try {
      const response = await fetchAPI(`/community/get-user-info/${userId}`, 'GET', null, setUserToken);
      if (response?.user?.image_url) {
        setUserAvatar(response.user.image_url);
      }
    } catch (e) {
      console.warn('Failed to fetch avatar', e);
    }
  };
  if (userId) fetchAvatar();
  }, [userId]);


  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar when focused
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        // Show tab bar when unfocused
        if (parent) {
          parent.setOptions({
            tabBarStyle: undefined,
          });
        }
      };
    }, [navigation])
  );

  const pickImage = async () => {
    //Limit the amount of images a user can post
    const remainingSlots = MAX_IMAGES - postImages.length

    if (remainingSlots <= 0) {
      Alert.alert("Max photos submitted", `You can only upload ${MAX_IMAGES} images`);
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots, //for ios this limits the max you can select
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uris = result.assets.map((asset) => asset.uri);

      //Make one last check before selecting photos to make sure you have under the max amount of photos
      setPostImages((prevImages) => {
        const combined = [...prevImages, ...uris];
        return combined.slice(0, MAX_IMAGES);
      });
    }
  };

  //We have deprecated the file upload feature, uncommit if bring it back :)
  // const pickPdf = async () => {
  //   try {
  //     if (postPdfs.length < 10) {
  //       const result = await DocumentPicker.getDocumentAsync({
  //         type: 'application/pdf',
  //         copyToCacheDirectory: true,
  //         multiple: true,
  //       });

  //       if (!result.canceled && result.assets) {
  //         const newPdfFiles = result.assets.map((asset) => ({
  //           uri: asset.uri,
  //           name: asset.name || 'Unknown Name',
  //         }));
  //         setPostPdfs((prev) => [...prev, ...newPdfFiles]);
  //       }
  //     } else {
  //       Alert.alert('Limit Reached', 'You can only select up to ten PDF files.');
  //     }
  //   } catch (error) {
  //     console.error('Error picking PDFs:', error);
  //   }
  // };


  // const removePdf = (index: number) => {
  //   setPostPdfs((prev) => prev.filter((_, i) => i !== index));
  // };

  const handleCreatePost = async () => {
    setError('');
    if (!postText.trim() && postImages.length <= 0) {
      setError('Please provide text for your post or an image.');
      return;
    } else if (userId === null) {
      setError('Please login to post.');
      return;
    }
    try {
      const postOrgId = userOrgId ?? null;
      const newPost = await createPostWithMedia(
        Number(userId),
        postOrgId,
        postText,
        postImages,
        postPdfs,
        setUserToken
      );

      // Save tag if one was selected
      if (selectedTag && newPost?.post_id) {
        const tags = await getAllTags(setUserToken);
        const matched = tags.find((t: any) => t.name === selectedTag);
        if (matched) {
          await setPostTag(newPost.post_id, matched.tag_id, setUserToken);
        }
      }



      await logActivity(userId, `User created new post with text: "${postText}"`);
      setPostText('');
      setPostImages([]);
      setPostPdfs([]);
      setSelectedTag(null);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      setError('Failed to create post. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  };



  return (
    <>
      <TopNav
        title="Create Post"
        showBack
        onBack={() => navigation.goBack()}
      />
      <SafeAreaView style={styles.container}>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.composerWrapper}>
            <Image
              source={{
                uri: userAvatar
                  ? `${process.env.EXPO_PUBLIC_API_URL}${userAvatar}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=e5e7eb&color=6b7280&size=128`
              }}
              style={styles.avatar}
              onError={(e) => {
                e.currentTarget.setNativeProps({
                  src: [{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=e5e7eb&color=6b7280&size=128` }]
                });
              }}
            />
            <View style={styles.composerSection}>
              <TextInput
                ref={postTextInputRef}
                style={styles.input}
                placeholder="Share what's on your mind..."
                placeholderTextColor="#9CA3AF"
                value={postText}
                onChangeText={setPostText}
                multiline
                numberOfLines={8}
                maxLength={25000}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              {postImages.length > 0 && (
                <View style={styles.mediaGrid}>
                  {postImages.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri }} style={styles.previewImage} />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        style={styles.removeImageButton}
                      >
                        <MaterialIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}



              {/* Deprectaed fire upload feature */}
              {/* {postPdfs.length > 0 && (
                <View style={styles.pdfContainer}>
                  {postPdfs.map((pdf, index) => (
                    <View key={index} style={styles.pdfItem}>
                      <MaterialIcons name="description" size={20} color="#0088ca" />
                      <Text style={styles.pdfName}>{pdf.name}</Text>
                      <TouchableOpacity
                        onPress={() => removePdf(index)}
                        style={styles.removePdfButton}
                      >
                        <MaterialIcons name="close" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )} */}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {/* Tag picker  */}
          <Text style={styles.fieldLabel}>Tag</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagRow}
          >
            {tagItems.map((item) => {
              const palette = tagStyles[item.value] || {
                backgroundColor: '#F1F3F5',
                textColor: '#374151',
              };

              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setSelectedTag(selectedTag === item.value ? null : item.value)}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: selectedTag === item.value
                        ? palette.textColor
                        : palette.backgroundColor,
                      borderColor: palette.textColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      { color: selectedTag === item.value ? '#fff' : palette.textColor },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>



          <TouchableOpacity disabled={!postText.trim() && postImages.length <= 0} onPress={handleCreatePost} activeOpacity={0.8} style={styles.postButtonWrapper}>
            <LinearGradient
              colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.postButton,
                !postText.trim() && postImages.length <= 0 && styles.postButtonDisabled,
              ]}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
              <MaterialIcons name="image" size={20} color="#0088ca" />
            </TouchableOpacity>

            {/* This is a button for file submission, remove it since I don't know why it would be needed in social app
            All functionality remains withing the app to handle it still */}
            {/* <TouchableOpacity style={styles.iconButton} onPress={pickPdf}>
              <MaterialIcons name="insert-drive-file" size={20} color="#0088ca" />
            </TouchableOpacity> */}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  postButtonWrapper: {
    marginBottom: 12,
  },
  postButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  composerWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  composerSection: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
    marginBottom: 12,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 14,
    marginTop: 8,
  },
  mediaGrid: {
    marginTop: 12,
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfContainer: {
    marginTop: 12,
    gap: 8,
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pdfName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    fontWeight: '500',
  },
  removePdfButton: {
    padding: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  tagChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1.5,
  },
  tagChipText: {
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  tagRow: {
    paddingBottom: 18,
    paddingRight: 18,
  },
});

export default CreatePostScreen;
