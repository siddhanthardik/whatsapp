import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ImportScreen } from './ContactsModule'

export default function ImportPage(){
  const navigate = useNavigate()
  return <ImportScreen onBack={() => navigate('/contacts')} />
}

