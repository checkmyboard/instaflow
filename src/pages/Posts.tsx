import { useEffect, useState } from 'react'
import { Film, RefreshCw, MessageSquare, Heart, ExternalLink, PlayCircle, Image, Grid2x2, AlertCircle } from 'lucide-react'
import Header from '../components/Header'
import type { Post } from '../types'

const typeLabel: Record<string, string> = {
  VIDEO: 'Reel',
  IMAGE: 'Foto',
  CAROUSEL_ALBUM: 'Carrossel',
  REELS: 'Reel',
}

const typeIcon: Record<string, React.ReactNode> = {
  VIDEO: <PlayCircle size={12} />,
  IMAGE: <Image size={12} />,
  CAROUSEL_ALBUM: <Grid2x2 size={12} />,
  REELS: <PlayCircle size={12} />,
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    fetch('/api/instagram/posts')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setPosts(d.data || [])
      })
      .catch(e => setError(e.message || 'Erro ao carregar posts'))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex-1">
      <Header
        title="Posts & Reels"
        subtitle="Posts da sua conta monitorados pelas automações"
        action={
          <button onClick={() => load(true)} className="btn-secondary" disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        }
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span><strong>Erro da API:</strong> {error}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 mb-3 text-sm">Como configurar corretamente:</h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Sua conta Instagram deve ser <strong>Business ou Creator</strong> (não pessoal)</li>
                <li>Converta em <strong>Instagram → Configurações → Conta → Mudar para conta profissional</strong></li>
                <li>Conecte a uma <strong>Página do Facebook</strong> em Instagram → Configurações → Conta → Página vinculada</li>
                <li>Gere um novo token no <strong>developers.facebook.com</strong> com permissões: <code className="bg-blue-100 px-1 rounded text-xs">instagram_basic</code>, <code className="bg-blue-100 px-1 rounded text-xs">instagram_manage_comments</code>, <code className="bg-blue-100 px-1 rounded text-xs">pages_read_engagement</code></li>
                <li>Cole o novo token em <a href="/settings" className="underline font-semibold">Configurações</a></li>
              </ol>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl aspect-square" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-16 text-center">
            <Film size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 text-lg mb-2">Nenhum post encontrado</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Configure seu token de acesso nas Configurações para ver os posts da sua conta.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{posts.length} posts encontrados</p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  const thumb = post.thumbnail_url || post.media_url
  const [imgError, setImgError] = useState(false)

  return (
    <div className="card overflow-hidden group hover:shadow-md transition-all duration-200">
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {thumb && !imgError ? (
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={32} className="text-gray-300" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
            {typeIcon[post.media_type] || <Film size={10} />}
            {typeLabel[post.media_type] || post.media_type}
          </span>
        </div>
        {/* External link on hover */}
        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1.5 hover:bg-white"
          >
            <ExternalLink size={13} className="text-gray-700" />
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-600 line-clamp-2 mb-2 min-h-[2.5rem]">
          {post.caption || <span className="text-gray-300 italic">Sem legenda</span>}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            {post.like_count !== undefined && (
              <span className="flex items-center gap-1">
                <Heart size={11} className="text-red-400" />
                {post.like_count.toLocaleString()}
              </span>
            )}
            {post.comments_count !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare size={11} className="text-blue-400" />
                {post.comments_count.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-gray-300">
            {new Date(post.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
}
