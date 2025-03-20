export async function encryptData(data: any): Promise<string> {
  try {
    const response = await fetch('/api/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Erro ao criptografar dados')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Erro ao criptografar dados:', error)
    throw error
  }
}

export async function decryptData(encryptedData: string): Promise<any> {
  try {
    const response = await fetch('/api/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: encryptedData }),
    })

    if (!response.ok) {
      throw new Error('Erro ao descriptografar dados')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error)
    throw error
  }
}
