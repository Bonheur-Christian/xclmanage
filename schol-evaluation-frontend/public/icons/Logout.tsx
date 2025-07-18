"use client"

import { useEffect, useState } from "react"

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export default function LogoutIcon({ width = 21, height = 21, className = "" }: IconProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const htmlElement = document.documentElement
      const bodyElement = document.body
      const isDarkMode = htmlElement.classList.contains("dark") || bodyElement.classList.contains("dark")
      setIsDark(isDarkMode)
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Logout icon keeps its red color (#AB1712) in both modes as it's a warning/action color
  const fillColor = "#AB1712"

  return (
    <svg width={width} height={height} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M17.9648 20.0142H8.60449C6.72363 20.0142 5.74805 19.0298 5.74805 17.1313V13.1763H7.4707V17.0259C7.4707 17.8433 7.90137 18.2915 8.75391 18.2915H17.8242C18.6768 18.2915 19.0986 17.8433 19.0986 17.0259V3.97412C19.0986 3.15674 18.6768 2.7085 17.8242 2.7085H8.75391C7.90137 2.7085 7.4707 3.15674 7.4707 3.97412V7.83252H5.74805V3.86865C5.74805 1.979 6.72363 0.98584 8.60449 0.98584H17.9648C19.8457 0.98584 20.8213 1.979 20.8213 3.86865V17.1313C20.8213 19.0298 19.8457 20.0142 17.9648 20.0142ZM12.3047 11.3042H3.44531L2.14453 11.2427L2.78613 11.7876L4.0957 13.0181C4.25391 13.1587 4.3418 13.3608 4.3418 13.563C4.3418 13.9585 4.04297 14.2925 3.63867 14.2925C3.42773 14.2925 3.26953 14.2046 3.12012 14.0552L0.272461 11.1108C0.0703125 10.8999 0 10.7065 0 10.4956C0 10.2847 0.0703125 10.0913 0.272461 9.88037L3.12012 6.92725C3.26953 6.77783 3.42773 6.69873 3.63867 6.69873C4.04297 6.69873 4.3418 7.01514 4.3418 7.41943C4.3418 7.61279 4.25391 7.82373 4.0957 7.96436L2.78613 9.20361L2.13574 9.74854L3.44531 9.67822H12.3047C12.7354 9.67822 13.1045 10.0474 13.1045 10.4956C13.1045 10.9438 12.7354 11.3042 12.3047 11.3042Z" fill={fillColor}/>
    </svg>
  )
}
