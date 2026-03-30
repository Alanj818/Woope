import React, { useContext, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopNav from '../components/TopNav';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../util/token';
import { createPostWithMedia } from '../api/posts';
import { logActivity } from '../api/activity';

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

  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postPdfs, setPostPdfs] = useState<PdfFile[]>([]);
  const [error, setError] = useState('');
  const postTextInputRef = useRef<TextInput>(null);



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
          type: 'application/pdf',
          copyToCacheDirectory: true,
          multiple: true,
        });

        if (!result.canceled && result.assets) {
          const newPdfFiles = result.assets.map((asset) => ({
            uri: asset.uri,
            name: asset.name || 'Unknown Name',
          }));
          setPostPdfs((prev) => [...prev, ...newPdfFiles]);
        }
      } else {
        Alert.alert('Limit Reached', 'You can only select up to ten PDF files.');
      }
    } catch (error) {
      console.error('Error picking PDFs:', error);
    }
  };

  const handleCreatePost = async () => {
    setError('');
    if (!postText.trim()) {
      setError('Please provide text for your post.');
      return;
    } else if (userId === null) {
      setError('Please login to post.');
      return;
    }
    try {
      const postOrgId = userOrgId ?? null;
      await createPostWithMedia(
        Number(userId),
        postOrgId,
        postText,
        postImages,
        postPdfs,
        setUserToken
      );
      await logActivity(userId, `User created new post with text: "${postText}"`);

      // Reset the form
      setPostText('');
      setPostImages([]);
      setPostPdfs([]);

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error(error);
      setError('Failed to create post. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removePdf = (index: number) => {
    setPostPdfs((prev) => prev.filter((_, i) => i !== index));
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
                uri: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png',
              }}
              style={styles.avatar}
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

              {postPdfs.length > 0 && (
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
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            disabled={!postText.trim()}
            onPress={handleCreatePost}
            activeOpacity={0.8}
            style={styles.postButtonWrapper}
          >
            <LinearGradient
              colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.postButton,
                !postText.trim() && styles.postButtonDisabled,
              ]}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
              <MaterialIcons name="image" size={20} color="#0088ca" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={pickPdf}>
              <MaterialIcons name="insert-drive-file" size={20} color="#0088ca" />
            </TouchableOpacity>
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
});

export default CreatePostScreen;
