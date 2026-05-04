import { fetchAPI, fetchAPIWithFiles  } from "./fetch";
import * as SecureStore from 'expo-secure-store';

type PdfFile = {
  uri: string;
  name: string;
};

// Create Post
export const createPost = async (
  user_id: number,
  org_id: number | null,
  content: string,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI('/forum/posts', 'POST', { user_id, org_id, content }, setUserToken);
};

export const createPostWithMedia = async (
  user_id: number,
  org_id: number | null,
  content: string,
  images: string[],
  pdfs: PdfFile[],
  setUserToken: (token: string | null) => void
) => {
  const formData = new FormData();
  formData.append('user_id', String(user_id));
  if(org_id) formData.append('org_id', String(org_id));
  formData.append('content', content);

  images.forEach((uri, index) => {
    formData.append('media', {
      uri,
      name: `image_${index}.jpg`,
      type: 'image/jpeg',
    } as any);
  });

  pdfs.forEach((pdf) => {
    formData.append('media', {
      uri: pdf.uri,
      name: pdf.name,
      type: 'application/pdf',
    } as any);
  });

  let token = await SecureStore.getItemAsync("accessToken");

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/forum/posts/media`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      // ← No Content-Type here, let fetch set it automatically with the boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server error: ${response.status} - ${text}`);
  }

  return await response.json();
};

// Get all posts
export const getAllPosts = async (
  id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}`, 'GET', null, setUserToken);
};

// Get posts with media
export const getAllPostsWithMedia = async (
  id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}/media`, 'GET', null, setUserToken);
};

// Get single post by ID
export const getPostById = async (
  id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}`, 'GET', null, setUserToken);
};

// Get posts by user ID
export const getPostByUserId = async (
  userId: number,
  setUserToken: (token: string | null) => void
) => {
  try {
    return await fetchAPI(`/forum/posts/user/${userId}`, 'GET', null, setUserToken);
  } catch (err) {
    const msg = String((err && (err as Error).message) || '');
    if (msg.toLowerCase().includes('post not found') || msg.toLowerCase().includes('posts not found')) {
      return [];
    }
    throw err;
  }
};

// Get posts with media by user ID
export const getPostByUserIdWithMedia = async (
  userId: number,
  setUserToken: (token: string | null) => void
) => {
  try {
    return await fetchAPI(`/forum/posts/user/${userId}/media`, 'GET', null, setUserToken);
  } catch (err) {
    const msg = String((err && (err as Error).message) || '');
    if (msg.toLowerCase().includes('post not found') || msg.toLowerCase().includes('posts not found')) {
      return [];
    }
    throw err;
  }
};

// Delete post
export const deletePost = async (
  id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}`, 'DELETE', null, setUserToken);
};

// Update post
export const updatePost = async (
  id: number,
  content: string,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}`, 'PUT', { content }, setUserToken);
};

// Like a post
export const likePost = async (
  id: number,
  user_id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}/like`, 'POST', { user_id }, setUserToken);
};

// Unlike a post
export const unlikePost = async (
  id: number,
  user_id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}/like`, 'DELETE', { user_id }, setUserToken);
};

// Get likes for a post
export const getPostLikes = async (
  id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${id}/likes`, 'GET', null, setUserToken);
};

// Get all posts liked by user
export const getUserLikedPosts = async (
  id: number,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/user/${id}/likes`, 'GET', null, setUserToken);
};

// Get all available tags
export const getAllTags = async (
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI('/forum/tags', 'GET', null, setUserToken);
};

// Set tag on a post
export const setPostTag = async (
  post_id: number,
  tag_id: number | null,
  setUserToken: (token: string | null) => void
) => {
  return fetchAPI(`/forum/posts/${post_id}/tag`, 'POST', { tag_id }, setUserToken);
};
