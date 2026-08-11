import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
}) {
  const { t } = useLanguage()
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="pagination">
      <div className="pagination-info">
        {t('showing')} {startItem} {t('of')} {endItem} {t('of')} {totalItems}
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
          {t('previous')}
        </button>
        <div className="pagination-pages">
          {getPageNumbers().map((page, i) =>
            page === '...' ? (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={page}
                className={`pagination-page ${currentPage === page ? 'pagination-page--active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t('next')}
          <ChevronRight size={16} />
        </button>
      </div>
      {onItemsPerPageChange && (
        <div className="pagination-per-page">
          <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  )
}
