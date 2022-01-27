export type GenreT =
  | 'Action'
  | 'Adult'
  | 'Adventure'
  | 'Comedy'
  | 'Doujinshi'
  | 'Drama'
  | 'Ecchi'
  | 'Fantasy'
  | 'Gender Bender'
  | 'Harem'
  | 'Hentai'
  | 'Historical'
  | 'Horror'
  | 'Isekai'
  | 'Josei'
  | 'Lolicon'
  | 'Martial Arts'
  | 'Mature'
  | 'Mecha'
  | 'Mystery'
  | 'Psychological'
  | 'Romance'
  | 'School Life'
  | 'Sci-fi'
  | 'Seinen'
  | 'Shotacon'
  | 'Shoujo'
  | 'Shoujo Ai'
  | 'Shounen'
  | 'Shounen Ai'
  | 'Slice of Life'
  | 'Smut'
  | 'Sports'
  | 'Supernatural'
  | 'Tragedy'
  | 'Yaoi'
  | 'Yuri';

export type MangaTypeT =
  | 'Manga'
  | 'Manhwa'
  | 'Manhua'
  | 'OEL'
  | 'Doujinshi'
  | 'One-shot';

export type MangaStatusT =
  | 'Cancelled'
  | 'Complete'
  | 'Discontinued'
  | 'Hiatus'
  | 'Ongoing';

export type RawDiscussionT = {
  CommentOrder: string;
  CountComment: string;
  PostID: string;
  PostTitle: string;
  PostType: '' | 'Request' | 'Question' | 'Announcement';
  TimeOrder: boolean;
  TimePosted: string;
  Username: string;
};

export type RawReplyT = {
  CommentContent: string;
  CommentID: string;
  TimeCommented: string;
  UserID: string;
  Username: string;
};

export type RawCommentT = {
  CommentContent: string;
  CommentID: string;
  LikeCount: string;
  Liked: boolean;
  Replies: RawReplyT[];
  ReplyCount: string;
  ReplyLimit: number;
  ReplyMessage: string;
  Replying: boolean;
  showReply: boolean;
  TimeCommented: string;
  UserID: string;
  Username: string;
};

export type RawPostT = {
  Comments: RawCommentT[];
  Notification: '0' | '1';
  PostContent: string;
  PostID: string;
  PostTitle: string;
  PostType: '' | 'Request' | 'Question' | 'Announcement';
  TimePosted: string;
  UserID: string;
  Username: string;
};
