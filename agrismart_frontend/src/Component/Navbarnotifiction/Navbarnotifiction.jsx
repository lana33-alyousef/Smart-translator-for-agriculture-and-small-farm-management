 import React, { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { HiBars3, HiOutlineXMark } from 'react-icons/hi2'
import { IoIosSearch } from "react-icons/io";
import './Navbarnotifiction.css'

const Navbarnotifiction = ({
  logo,
  brand = 'AgriSmart',
  links = [],
  showSearch = true,
  searchPlaceholder = 'ابحث',
  searchValue,
  defaultSearchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPages = [],
  onSearchPageMatch,
  onSearchPageMiss,
  onMenuButtonClick,
  className = ''
}) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [internalSearch, setInternalSearch] = useState(defaultSearchValue)

  const currentSearch = useMemo(() => {
    return searchValue !== undefined ? searchValue : internalSearch
  }, [searchValue, internalSearch])

  const hasSearchText = String(currentSearch ?? '').trim().length > 0

  const searchablePages = useMemo(() => {
    if (Array.isArray(searchPages) && searchPages.length > 0) {
      return searchPages
    }
    return Array.isArray(links) ? links : []
  }, [searchPages, links])

  const handleInputChange = (event) => {
    const nextValue = event.target.value

    if (searchValue === undefined) {
      setInternalSearch(nextValue)
    }

    if (onSearchChange) {
      onSearchChange(nextValue)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (onSearchSubmit) {
      onSearchSubmit(currentSearch)
    }

    const normalizedQuery = String(currentSearch ?? '').trim().toLowerCase()
    if (!normalizedQuery || searchablePages.length === 0) {
      return
    }

    const matchedPage = searchablePages.find((page) => {
      const keywords = Array.isArray(page?.keywords) ? page.keywords.join(' ') : ''
      const pageLabel = page?.label || page?.content || page?.title || ''
      const pagePath = page?.to || page?.path || page?.href || page?.url || ''
      const searchableText = `${pageLabel} ${pagePath} ${keywords}`
      return searchableText.toLowerCase().includes(normalizedQuery)
    })

    if (!matchedPage) {
      if (onSearchPageMiss) {
        onSearchPageMiss(currentSearch)
      }
      return
    }

    const nextPath = matchedPage.to || matchedPage.path || matchedPage.href || matchedPage.url
    if (nextPath) {
      if (String(nextPath).startsWith('http')) {
        window.location.assign(nextPath)
      } else {
        navigate(nextPath)
      }
      closeMobileMenu()
    }

    if (onSearchPageMatch) {
      onSearchPageMatch(matchedPage, currentSearch)
    }
  }

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev)
    if (onMenuButtonClick) {
      onMenuButtonClick()
    }
  }

  const closeMobileMenu = () => setIsOpen(false)

  return (
    <header className={`smartHeader ${className}`.trim()}>
      <div className='smartHeader__brand'>
        
        {logo && <img src={logo} alt={brand} className='smartHeader__logo' />}
         <span className='smartHeader__title'>{brand}</span>
      </div>

      <div className={`smartHeader__middle ${isOpen ? 'is-open' : ''}`}>
        <ul className='smartHeader__links'>
          {links.map((item, index) => {
            const key = item.id || item.to || item.url || item.href || `${item.label || item.content}-${index}`
            const to = item.to || item.url || item.path
            const label = item.label || item.content || item.title

            if (to) {
              return (
                <li key={key}>
                  <NavLink
                    to={to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    {label}
                  </NavLink>
                </li>
              )
            }

            if (item.href) {
              return (
                <li key={key}>
                  <a href={item.href} onClick={closeMobileMenu}>
                    {label}
                  </a>
                </li>
              )
            }

            return (
              <li key={key}>
                <button type='button' onClick={item.onClick}>
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className='smartHeader__actions'>
        {showSearch && (
          <form className='smartHeader__searchTop' onSubmit={handleSubmit}>
            <div className='smartHeader__searchField'>
              <input
                type='search'
                className='smartHeader__searchInput'
                value={currentSearch}
                placeholder={searchPlaceholder}
                onChange={handleInputChange}
                aria-label='search'
              />
              {!hasSearchText && (
                <button
                  type='submit'
                  className='smartHeader__searchBtn'
                  aria-label='search pages'
                >
                  <span>البحث</span>
                  <IoIosSearch />
                </button>
              )}
            </div>
          </form>
        )}

        <button
          type='button'
          className='smartHeader__menuBtn'
          onClick={handleToggleMenu}
          aria-label={isOpen ? 'close menu' : 'open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <HiOutlineXMark /> : <HiBars3 />}
        </button>
      </div>
    </header>
  )
}

export default Navbarnotifiction
