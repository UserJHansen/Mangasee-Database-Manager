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

export type RawMangaCommentT = {
  CommentContent: string;
  CommentID: string;
  LikeCount: string;
  Liked: boolean;
  Replies: RawReplyT[];
  ReplyCount: string;
  ReplyMessage: string;
  Replying: boolean;
  showReply: boolean;
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

export type RawMangaT = {
  i: string; // indexable Name
  s: string; // Full Name
  o: 'yes' | 'no'; // is Official?
  ss: MangaStatusT; // Scan Status
  ps: MangaStatusT; // Publish Status
  t: MangaTypeT; // Type of Manga (Manhua)
  v: string; // Popularity of all time
  vm: string; // Popularity of this month
  y: string; // Year of Release
  a: string[]; // Author
  al: string[]; // Alternate names
  l: string; // Latest Chapter Chapter
  lt: number; // Latest Chapter Date in Unix Time
  ls: string; // Latest Chapter Date
  g: GenreT[]; // Genres
  h: boolean; // isPopular
};

export type RawChapterT = {
  Chapter: string;
  Type: string;
  Page?: string;
  Directory?: string;
  Date: string;
  ChapterName: string | null;
};

export type RawBookmarkT = {
  Removing: boolean;
  SeriesID: string;
  SeriesName: string;
  IndexName: string;
  Chapter: string;
  Page: string;
  Date: string;
  DateStamp: number;
};

export type RawSubscriptionT = {
  DateLatest: string;
  DateStamp: number;
  DateSubscribed: string;
  EmailNotify: '1' | '0';
  IndexName: string;
  LatestChapter: {
    Chapter: string;
    Date: string;
  };
  PublishStatus: MangaStatusT;
  ReadStatus: '1' | '2' | '3' | '4' | '5';
  Removing: boolean;
  SeriesID: string;
  SeriesName: string;
};
