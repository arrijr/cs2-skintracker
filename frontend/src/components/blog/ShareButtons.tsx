// frontend/src/components/blog/ShareButtons.tsx
'use client';

import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/lib/mdx';

interface ShareButtonsProps {
  post: BlogPost;
}

export function ShareButtons({ post }: ShareButtonsProps) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const title = post.title;
  const description = post.description || post.excerpt || '';

  const shareData = {
    title,
    text: description,
    url,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled share or share unsupported — non-fatal
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch {
      // clipboard write blocked — non-fatal
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center space-x-2"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="flex items-center space-x-2"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="flex items-center space-x-2"
      >
        <Facebook className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="flex items-center space-x-2"
      >
        <Linkedin className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center space-x-2"
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
