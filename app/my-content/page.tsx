"use client"
import MyContent from '@/pages/MyContent'
import React, { Suspense } from 'react'

const MyContentPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MyContent />
        </Suspense>
    )
}

export default MyContentPage