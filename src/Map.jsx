import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Space,
  Tag,
} from 'tdesign-react'
import {
  HomeIcon,
  ArrowLeftIcon,
} from 'tdesign-icons-react'

function Software() {
  return (
    <div className="software-page">
      {/* 页面头部 */}
      <section className="software-hero">
        <div className="software-hero-content">
          <Tag theme="primary" variant="light" shape="round" size="medium" className="software-tag">
            卫星地图
          </Tag>
          <h1 className="software-title">
            <span className="software-title-main">卫星地图</span>
            <span className="software-title-sub">实时查看服务器世界</span>
          </h1>
          <p className="software-desc">
            通过卫星地图实时查看晏阳城市建设服务器的世界全貌，追踪建设进度。
          </p>
          <Space size="medium" className="software-actions">
            <Link to="/">
              <Button theme="primary" size="large" shape="round" icon={<HomeIcon />}>
                返回首页
              </Button>
            </Link>
          </Space>
        </div>
      </section>

      {/* 地图容器 */}
      <section className="software-section">
        <div className="map-container">
          <iframe
            src="http://103.40.14.14:28826"
            title="卫星地图"
            className="map-iframe"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  )
}

export default Software
