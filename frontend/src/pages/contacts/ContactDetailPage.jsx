import React from 'react'
import { useParams } from 'react-router-dom'
import { useContact } from '../../hooks/useContacts'
import { Avatar, Tag, MsgBadge } from './contactsCommon'

export default function ContactDetailPage(){
  const { id } = useParams()
  const { data, isLoading } = useContact(id)
  const contact = data && (data.item || data)

  if(isLoading) return <div style={{ padding:20 }}>Loading...</div>
  if(!contact) return <div style={{ padding:20 }}>Contact not found</div>

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <Avatar name={contact.name} size={56} />
        <div>
          <div style={{ fontSize:18, fontWeight:800 }}>{contact.name}</div>
          <div style={{ color:'#64748B' }}>{contact.phone}</div>
        </div>
      </div>

      <div style={{ marginTop:18 }}>
        <div style={{ fontWeight:700, marginBottom:8 }}>Profile</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{contact.tags?.map(t=> <Tag key={t} label={t} />)}</div>
      </div>

      <div style={{ marginTop:18 }}>
        <div style={{ fontWeight:700, marginBottom:8 }}>Messages</div>
        {(contact.messages || []).map(m=> (
          <div key={m.id} style={{ padding:10, border:'1px solid #E6E9EE', borderRadius:8, marginBottom:8 }}>
            <div style={{ fontSize:13, color:'#0F172A' }}>{m.text}</div>
            <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:12, color:'#64748B' }}>{m.time}</div>
              <MsgBadge status={m.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

