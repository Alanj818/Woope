import express from 'express';
import {
    getPost,
    getPostById,
    getPostByUserId,
    createPost,
    updatePost,
    deletePost,
    softDeletePost,
    restorePost,
    addPostLike,
    removePostLike,
    getPostLikes,
    getPostWithMedia,
    searchPosts,
    getPostsByOrgId,
    savePostMedia,
    deletePostMedia
} from '../models/posts';

import { authenticateToken, requirePermission } from '../middleware/authMiddleware';
import { requireOwnershipOrPermission } from '../middleware/requireOwnershipOrPermission';

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = require('express').Router();

// ─── Multer Config ────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.body.user_id;
        const now = new Date();
        const dir = path.join(process.cwd(), `uploads/users/${userId}/${now.getFullYear()}/${now.getMonth() + 1}`);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'));
    },
});

// ─── GET Routes ───────────────────────────────────────────────────────────────

// Search posts (admin) — must be before /posts/:id
router.get('/posts', async (req: express.Request, res: express.Response) => {
    try {
        const search = req.query.search ? String(req.query.search) : '';
        const posts = await searchPosts(search);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Get posts with media — must be before /posts/:id
router.get('/posts/:id/media', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const userId = Number(req.params.id);
        const posts = await getPostWithMedia(userId);
        res.status(200).json(posts);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Get posts by user ID — must be before /posts/:id
router.get('/posts/user/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const posts = await getPostByUserId(Number(req.params.id));
        if (posts.length === 0) {
            return res.status(404).json('Posts not found');
        }
        res.status(200).json(posts);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Get posts by user likes — must be before /posts/:id
router.get('/posts/user/:id/likes', async (req: express.Request, res: express.Response) => {
    try {
        const userId = Number(req.params.id);
        const likes = await getPostLikes(userId);
        res.status(200).json(likes);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Get posts by org ID — must be before /posts/:id
router.get('/posts/org/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const posts = await getPostsByOrgId(Number(req.params.id));
        if (!posts) {
            return res.status(404).json('Posts not found');
        }
        res.status(200).json(posts);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Get likes for a post — must be before /posts/:id
router.get('/posts/:id/like', async (req: express.Request, res: express.Response) => {
    try {
        const postId = Number(req.params.id);
        const likes = await getPostLikes(postId);
        res.status(200).json(likes);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Get all posts by current user ID — generic, goes after specific /posts/* routes
router.get('/posts/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const userId = Number(req.params.id);
        const posts = await getPost(userId);
        res.status(200).json(posts);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Get a single post by ID
router.get('/:id/posts', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const post = await getPostById(Number(req.params.id));
        if (!post) {
            return res.status(404).json('Post not found');
        }
        res.status(200).json(post);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// ─── POST Routes ──────────────────────────────────────────────────────────────

// Create post with media — must be before /posts
router.post(
    '/posts/media',
    authenticateToken,
    requirePermission('create_post'),
    upload.array('media', 10),
    async (req: express.Request, res: express.Response) => {
        try {
            const { user_id, content } = req.body;
            const org_id = req.body.org_id ? Number(req.body.org_id) : null;
            const files = req.files as Express.Multer.File[];

            const newPost = await createPost(Number(user_id), org_id, content);

            const now = new Date();
            const mediaPromises = files.map((file) => {
                const relativeUrl = `/uploads/users/${user_id}/${now.getFullYear()}/${now.getMonth() + 1}/${file.filename}`;
                const mediaType = file.mimetype === 'application/pdf' ? 'PDF' : 'Image';
                return savePostMedia(newPost.post_id, relativeUrl, mediaType);
            });

            const media = await Promise.all(mediaPromises);
            res.status(201).json({ ...newPost, media });
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json(`Internal server error: ${error.message}`);
            } else {
                res.status(500).json('Internal server error: An unknown error occurred');
            }
        }
    }
);

// Like a post — must be before /posts
router.post('/posts/:id/like', async (req: express.Request, res: express.Response) => {
    try {
        const postId = Number(req.params.id);
        const userId = Number(req.body.user_id);
        await addPostLike(postId, userId);
        res.status(201).json({ message: "Like added successfully" });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Create a new post (text only) — generic, goes after specific /posts/* routes
router.post('/posts', authenticateToken, requirePermission('create_post'), async (req: express.Request, res: express.Response) => {
    try {
        const newPost = await createPost(Number(req.body.user_id), req.body.org_id, req.body.content);
        res.status(201).json(newPost);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// ─── PUT Routes ───────────────────────────────────────────────────────────────

// Restore a soft deleted post — must be before /posts/:id
router.put('/posts/restore/:id', async (req: express.Request, res: express.Response) => {
    try {
        const restoredPost = await restorePost(Number(req.params.id));
        res.status(200).json(restoredPost);
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json(`Internal server error: ${error.message}`);
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Update a post — generic, goes after specific /posts/* routes
router.put('/posts/:id',
    authenticateToken,
    requireOwnershipOrPermission({
        fetchResource: getPostById,
        permissionOwn: 'edit_own_post',
        permissionAll: 'edit_all_posts',
        extractUserId: (post) => post.user_id!,
        idSource: 'params',
        idKey: 'id',
    }),
    async (req: express.Request, res: express.Response) => {
        try {
            const updatedPost = await updatePost(Number(req.params.id), req.body.content);
            res.status(200).json(updatedPost);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json(`Internal server error: ${error.message}`);
            } else {
                res.status(500).json('Internal server error: An unknown error occurred');
            }
        }
    }
);

// ─── DELETE Routes ────────────────────────────────────────────────────────────

// Unlike a post — must be before /posts/:id
router.delete('/posts/:id/like', async (req: express.Request, res: express.Response) => {
    try {
        const postId = Number(req.params.id);
        const userId = Number(req.body.user_id);
        await removePostLike(postId, userId);
        res.status(200).json({ message: "Like removed successfully" });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: `Internal server error: ${error.message}` });
        } else {
            res.status(500).json('Internal server error: An unknown error occurred');
        }
    }
});

// Soft delete a post — must be before /posts/:id
router.delete('/posts/soft/:id',
    authenticateToken,
    requireOwnershipOrPermission({
        fetchResource: getPostById,
        permissionOwn: 'delete_own_post',
        permissionAll: 'delete_all_posts',
        extractUserId: (post) => post.user_id!,
        idSource: 'params',
        idKey: 'id',
    }),
    async (req: express.Request, res: express.Response) => {
        try {
            await softDeletePost(Number(req.params.id));
            res.status(200).json({ message: "Post soft deleted successfully" });
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json(`Internal server error: ${error.message}`);
            } else {
                res.status(500).json('Internal server error: An unknown error occurred');
            }
        }
    }
);

// Delete a post 
router.delete('/posts/:id',
    authenticateToken,
    requireOwnershipOrPermission({
        fetchResource: getPostById,
        permissionOwn: 'delete_own_post',
        permissionAll: 'delete_all_posts',
        extractUserId: (post) => post.user_id!,
        idSource: 'params',
        idKey: 'id',
    }),
    async (req: express.Request, res: express.Response) => {
        try {
            await deletePostMedia(Number(req.params.id));
            await deletePost(Number(req.params.id));
            res.status(204).send();
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json(`Internal server error: ${error.message}`);
            } else {
                res.status(500).json('Internal server error: An unknown error occurred');
            }
        }
    }
);

module.exports = router;
