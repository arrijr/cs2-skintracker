import express from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// View-count incrementer is unauthenticated by design (anonymous reads count).
// Without a limiter, anyone can flood `POST /api/v1/blog/:id/view` to spam
// DB writes + inflate counts. 60/min/IP is plenty for a real reader.
const viewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no auth required)
// GET /api/blog - Liste aller veröffentlichten Posts (mit Pagination, Filter)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tag, 
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      isPublished: true,
      ...(category && { category }),
      ...(tag && { tags: { has: tag } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// GET /api/blog/:slug - Einzelner Post
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Only return published posts to non-admin users.
    // PREVIOUS BUG: `!req.user?.role === 'admin'` was parsed as
    // `(!req.user?.role) === 'admin'`, which is `boolean === string` → always
    // false, so the gate always passed and every draft was readable by
    // anyone who hit GET /api/v1/blog/:slug. requireAuth was not mounted on
    // this route, so req.user was undefined regardless. Drafts are now
    // 404'd to unauthenticated callers, and the admin draft view is the
    // explicit /admin/:id endpoint below.
    if (!post.isPublished) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// POST /api/blog - Neuen Post erstellen (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      excerpt,
      category,
      tags = [],
      featuredImage,
      isPublished = false
    } = req.body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return res.status(400).json({ error: 'A post with this title already exists' });
    }

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        description,
        content,
        excerpt,
        category,
        tags,
        featuredImage,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        authorId: req.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// PUT /api/blog/:id - Post bearbeiten (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      content,
      excerpt,
      category,
      tags = [],
      featuredImage,
      isPublished
    } = req.body;

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug }
      });

      if (slugExists && slugExists.id !== parseInt(id)) {
        return res.status(400).json({ error: 'A post with this title already exists' });
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(content && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category && { category }),
      ...(tags && { tags }),
      ...(featuredImage !== undefined && { featuredImage }),
      ...(isPublished !== undefined && { isPublished }),
      ...(slug !== existingPost.slug && { slug })
    };

    // Set publishedAt if publishing for the first time
    if (isPublished && !existingPost.isPublished) {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// DELETE /api/blog/:id - Post löschen (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    await prisma.blogPost.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// PATCH /api/blog/:id/publish - Post veröffentlichen (Admin only)
router.patch('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const post = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const updateData = { isPublished };
    if (isPublished && !post.isPublished) {
      updateData.publishedAt = new Date();
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post publish status:', error);
    res.status(500).json({ error: 'Failed to update blog post publish status' });
  }
});

// POST /api/blog/:id/view - View Count erhöhen
router.post('/:id/view', viewLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    res.json({ message: 'View count updated' });
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

// GET /api/blog/admin/:id - Einzelnen Post nach ID für Admin
router.get('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching admin blog post by ID:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// GET /api/blog/admin/all - Alle Posts für Admin (published + drafts)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tag, 
      search,
      isPublished,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      ...(category && { category }),
      ...(tag && { tags: { has: tag } }),
      ...(isPublished !== undefined && { isPublished: isPublished === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch admin blog posts' });
  }
});

export default router;
