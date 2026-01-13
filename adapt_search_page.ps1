$source = 'C:\Users\ernes\Desktop\111.com\src\pages\search-results\page.tsx'
$dest = 'app\search-results\page.tsx'

Write-Host "Reading source file..."
$content = [System.IO.File]::ReadAllText($source, [System.Text.Encoding]::UTF8)

Write-Host "Adding 'use client' directive..."
$content = "'use client';`n`n$content"

Write-Host "Replacing imports..."
$content = $content -replace "import.*from 'react-router-dom'", "import { useSearchParams } from 'next/navigation';`nimport { useRouter } from 'next/navigation'"
$content = $content -replace "from '../../components/feature/Header'", "from '@/components/feature/Header'"
$content = $content -replace "from '../../components/feature/Footer'", "from '@/components/feature/Footer'"
$content = $content -replace "from '../../components/feature/SharedPropertyCard'", "from '@/components/feature/SharedPropertyCard'"
$content = $content -replace "from '../../components/feature/PropertyMap'", "from '@/components/feature/PropertyMap'"
$content = $content -replace "from '../../mocks/properties'", "from '@/mocks/properties'"
$content = $content -replace "from '../../components/feature/ZoneFilter'", "from '@/components/feature/ZoneFilter'"
$content = $content -replace "from '../../components/feature/CategoryFilter'", "from '@/components/feature/CategoryFilter'"
$content = $content -replace "from '../../lib/supabaseFunctions'", "from '@/lib/supabaseFunctions'"
$content = $content -replace "from '../../utils/propertyTransform'", "from '@/utils/propertyTransform'"
$content = $content -replace "from '../../hooks/useFavorites'", "from '@/hooks/useFavorites'"
$content = $content -replace "from '../../hooks/useToast'", "from '@/hooks/useToast'"
$content = $content -replace "from '../../hooks/useAuth'", "from '@/hooks/useAuth'"

Write-Host "Fixing useSearchParams usage..."
# React Router: const [searchParams, setSearchParams] = useSearchParams();
# Next.js: const searchParams = useSearchParams(); const router = useRouter();
$content = $content -replace "const \[searchParams, setSearchParams\] = useSearchParams\(\);", "const searchParams = useSearchParams();`n  const router = useRouter();"

Write-Host "Writing to destination..."
[System.IO.File]::WriteAllText($dest, $content, [System.Text.Encoding]::UTF8)

Write-Host "Done! File copied and adapted."
