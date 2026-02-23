function Activity() {
  return (
    <div className="activity-page">
      <div className="activity-hero">
        <h1>活动与动态</h1>
        <p>晏阳城市建设的最新动态、版本更新与社群活动</p>
      </div>

      <div className="timeline">
        <div className="timeline-item">
          <div className="timeline-date">2025 年</div>
          <h3>城市南拓计划启动</h3>
          <p>晏阳正式启动南部新城开发建设，规划新增多条地铁线路延伸段，覆盖南拓片区主要功能区域。</p>
          <span className="timeline-tag">城市建设</span>
        </div>

        <div className="timeline-item">
          <div className="timeline-date">2024 年末</div>
          <h3>轨道交通线网全面升级</h3>
          <p>完成第 19 条地铁线路的开通运营，建成第 7 座换乘枢纽，实现市区 20 分钟出行圈的目标。</p>
          <span className="timeline-tag">轨道交通</span>
        </div>

        <div className="timeline-item">
          <div className="timeline-date">2024 年</div>
          <h3>服务器迁移至新平台</h3>
          <p>为提供更稳定的游戏体验，服务器完成基础设施升级，实现每日自动备份与快速故障恢复机制。</p>
          <span className="timeline-tag">技术升级</span>
        </div>

        <div className="timeline-item">
          <div className="timeline-date">2024 年中</div>
          <h3>官方网站上线</h3>
          <p>晏阳城市建设官方网站正式上线，提供服务器介绍、加入指引、活动动态等信息展示。</p>
          <span className="timeline-tag">社群建设</span>
        </div>

        <div className="timeline-item">
          <div className="timeline-date">2023 年</div>
          <h3>成员突破 50 人</h3>
          <p>社群持续壮大，汇聚了来自多地的城市规划、建筑设计、轨道交通等领域爱好者，共同创作。</p>
          <span className="timeline-tag">里程碑</span>
        </div>

        <div className="timeline-item">
          <div className="timeline-date">2022 年 7 月</div>
          <h3>晏阳城市建设成立</h3>
          <p>晏阳城市建设服务器正式成立，开启了以城市规划与轨道交通为核心的 Minecraft 创作之旅。</p>
          <span className="timeline-tag">起源</span>
        </div>
      </div>
    </div>
  )
}

export default Activity
