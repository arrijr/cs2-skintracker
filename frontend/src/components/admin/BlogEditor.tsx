// frontend/src/components/admin/BlogEditor.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  Send, 
  Upload, 
  Plus, 
  X, 
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Code
} from 'lucide-react';
import { BlogPost } from '@/lib/blog';
import { serializeMdx, MDXRemote } from '@/lib/mdx';
import MDXComponents from '@/components/blog/MDXComponents';
import SkinCardPicker from '@/components/admin/SkinCardPicker';
import ImageUpload from '@/components/admin/ImageUpload';
import { apiUrl } from '@/lib/api';

interface BlogEditorProps {
  initialPost?: BlogPost;
}

const CATEGORIES = [
  'Market Analysis',
  'Investment Guides',
  'Updates', 
  'Case Statistics'
];

export default function BlogEditor({ initialPost }: BlogEditorProps) {
  const router = useRouter();
  const isEditing = !!initialPost;

  // Form state
  const [formData, setFormData] = useState({
    title: initialPost?.title || '',
    slug: initialPost?.slug || '',
    description: initialPost?.description || '',
    excerpt: initialPost?.excerpt || '',
    content: initialPost?.content || '',
    category: initialPost?.category || 'Market Analysis',
    tags: initialPost?.tags || [],
    featuredImage: initialPost?.featuredImage || '',
    isPublished: initialPost?.isPublished || false,
  });

  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Generate slug from title
  useEffect(() => {
    if (!isEditing && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, isEditing]);

  // Serialize MDX for preview
  useEffect(() => {
    if (formData.content) {
      serializeMdx(formData.content).then(setMdxSource);
    }
  }, [formData.content]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const insertSkinCard = (skinId: number) => {
    const skinCardText = `<SkinCard id="${skinId}" />`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + skinCardText
    }));
    setShowSkinPicker(false);
  };

  const insertImage = (imageUrl: string) => {
    const imageText = `![Image](${imageUrl})`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + imageText
    }));
    setShowImageUpload(false);
  };

  const handleSave = async (publish = false) => {
    try {
      setSaving(true);
      
      const postData = {
        ...formData,
        isPublished: publish || formData.isPublished,
        publishedAt: publish ? new Date().toISOString() : formData.isPublished ? initialPost?.publishedAt : null,
      };

      let response;
      if (isEditing) {
        response = await fetch(apiUrl(`/api/v1/blog/${initialPost!.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('clerk-session-token')}`,
          },
          body: JSON.stringify(postData),
        });
      } else {
        response = await fetch(apiUrl('/api/v1/blog'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('clerk-session-token')}`,
          },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save blog post');
      }

      const savedPost = await response.json();
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert('Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Post Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter blog post title"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="url-friendly-slug"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description for SEO and social sharing"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                placeholder="Short excerpt for blog listing"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="featuredImage">Featured Image URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageUpload(true)}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center">
                  {tag}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Content (MDX)
              </span>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSkinPicker(true)}
                >
                  <LinkIcon className="w-4 h-4 mr-1" />
                  Add Skin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageUpload(true)}
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Add Image
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your blog post content in MDX format..."
              rows={20}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
                variant="outline"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="bg-brand-celadon-600 hover:bg-brand-celadon-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {saving ? 'Publishing...' : 'Publish'}
              </Button>

              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        {previewMode ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <h1 className="text-brand-celadon-400">{formData.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">{formData.description}</p>
                <Separator className="my-4" />
                {mdxSource && (
                  <MDXRemote {...mdxSource} components={MDXComponents} />
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Post Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{formData.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.description || 'No description'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={formData.isPublished ? 'default' : 'secondary'}>
                    {formData.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge variant="outline">{formData.category}</Badge>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Slug: /blog/{formData.slug || 'untitled'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showSkinPicker && (
        <SkinCardPicker
          onSelect={insertSkinCard}
          onClose={() => setShowSkinPicker(false)}
        />
      )}

      {showImageUpload && (
        <ImageUpload
          onUpload={insertImage}
          onClose={() => setShowImageUpload(false)}
        />
      )}
    </div>
  );
}
