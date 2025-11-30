export interface Theme {
  id?: string
  nurseryId?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  fontSizeBase: string
  logoUrl?: string
  faviconUrl?: string
  borderRadius: string
  spacingUnit: string
  themeMode: string
}

export interface ThemeRequest {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  fontSizeBase?: string
  logoUrl?: string
  faviconUrl?: string
  borderRadius?: string
  spacingUnit?: string
  themeMode?: string
}

