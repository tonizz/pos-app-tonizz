// Chart Export Utilities
// Export charts as PNG images

export const exportChartAsPNG = (chartId: string, filename: string) => {
  try {
    const chartElement = document.getElementById(chartId)
    if (!chartElement) {
      throw new Error('Chart element not found')
    }

    // Get the SVG element from Recharts
    const svgElement = chartElement.querySelector('svg')
    if (!svgElement) {
      throw new Error('SVG element not found in chart')
    }

    // Create a canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect()
    canvas.width = svgRect.width
    canvas.height = svgRect.height

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    // Create image and draw to canvas
    const img = new Image()
    img.onload = () => {
      // Fill white background
      ctx.fillStyle = '#1f2937' // gray-800 background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw image
      ctx.drawImage(img, 0, 0)

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(link.href)
        }
      })

      URL.revokeObjectURL(url)
    }

    img.src = url
  } catch (error) {
    console.error('Export chart error:', error)
    throw error
  }
}

// Export all charts as a single image
export const exportAllChartsAsPNG = (chartIds: string[], filename: string) => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    let totalHeight = 0
    let maxWidth = 0
    const chartElements: { element: SVGElement; height: number; width: number }[] = []

    // Collect all chart elements and calculate dimensions
    chartIds.forEach(chartId => {
      const chartElement = document.getElementById(chartId)
      if (chartElement) {
        const svgElement = chartElement.querySelector('svg')
        if (svgElement) {
          const rect = svgElement.getBoundingClientRect()
          chartElements.push({
            element: svgElement,
            height: rect.height,
            width: rect.width
          })
          totalHeight += rect.height + 20 // Add spacing
          maxWidth = Math.max(maxWidth, rect.width)
        }
      }
    })

    canvas.width = maxWidth
    canvas.height = totalHeight

    // Fill background
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let currentY = 0
    let processedCharts = 0

    // Draw each chart
    chartElements.forEach((chart, index) => {
      const svgData = new XMLSerializer().serializeToString(chart.element)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, currentY)
        currentY += chart.height + 20
        processedCharts++

        URL.revokeObjectURL(url)

        // When all charts are processed, download
        if (processedCharts === chartElements.length) {
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a')
              link.href = URL.createObjectURL(blob)
              link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(link.href)
            }
          })
        }
      }

      img.src = url
    })
  } catch (error) {
    console.error('Export all charts error:', error)
    throw error
  }
}
