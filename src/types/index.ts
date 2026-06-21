export interface Automation {
  id: string
  name: string
  active: boolean
  keyword: string
  matchType: 'exact' | 'contains' | 'startsWith'
  postIds: string[] | 'all'
  commentReplies: string[]
  dmMessage: string
  dmMessages: string[]
  replyToCommentEnabled: boolean
  sendDmEnabled: boolean
  requireFollower: boolean
  nonFollowerReply: string
  createdAt: string
  stats: {
    triggered: number
    commentsSent: number
    dmsSent: number
  }
}

export interface Post {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'
  media_url?: string
  thumbnail_url?: string
  caption?: string
  timestamp: string
  like_count?: number
  comments_count?: number
  permalink?: string
}

export interface Contact {
  id: string
  username: string
  name: string
  profilePic?: string
  firstSeen: string
  lastInteraction: string
  totalInteractions: number
  interactions: Interaction[]
}

export interface Interaction {
  id: string
  contactId: string
  automationId: string
  automationName: string
  postId: string
  commentText: string
  replySent: boolean
  dmSent: boolean
  timestamp: string
}

export interface Settings {
  accessToken: string
  instagramAccountId: string
  igUsername?: string
  pollingInterval: number
  webhookVerifyToken: string
  webhookConnected: boolean
}

export interface DashboardStats {
  totalAutomations: number
  activeAutomations: number
  totalContacts: number
  totalInteractions: number
  commentsSent: number
  dmsSent: number
  recentActivity: Interaction[]
}
