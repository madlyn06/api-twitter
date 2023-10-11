import React from 'react'
import { useEffect } from 'react'
import { useRef } from 'react'
import { io } from 'socket.io-client'
import Peer from 'simple-peer'
export default function Chat() {
  //   React.useEffect(() => {
  //     const socket = io('http://localhost:3001/')
  //     socket.on('connect', () => {
  //       console.log(socket.id)
  //     })
  //   })
  //   return (
  //     <div>
  //       <video controls autoPlay name='media'>
  //         <source src='http://huongson.vov.link:8000/stream' type='audio/mpeg' />
  //       </video>
  //     </div>
  //   )
  const myVideoRef = useRef()
  const peerRef = useRef()
  const isHost = true

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        myVideoRef.current.srcObject = stream

        // Khởi tạo một kết nối WebRTC
        peerRef.current = new Peer({
          initiator: true,
          trickle: false,
          stream: null // Chỉ cho chủ phòng phát âm thanh
        })

        peerRef.current.on('signal', (data) => {
          // Gửi tín hiệu kết nối này đến người khác (sử dụng server hoặc truyền trực tiếp)
        })

        peerRef.current.on('stream', (remoteStream) => {
          // Hiển thị âm thanh từ người khác
          // Bạn có thể thêm audio element để phát trực tiếp âm thanh từ người khác
        })
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error)
      })
  }, [])

  return (
    <div>
      <video ref={myVideoRef} autoPlay muted={!isHost} controls />
    </div>
  )
}
