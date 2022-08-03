import BaseSource from '@ircam/como/common/sources/BaseSource';

class ComoteSource extends BaseSource {
  constructor(como, streamId = null) {
    super();

    this.como = como;
    this.streamId = streamId;

    this.data = {
      metas: {},
      accelerationIncludingGravity: {},
      rotationRate: {},
    };

    this.process = this.process.bind(this);
  }

  addListener(callback) {
    super.addListener(callback);

    return () => this.removeListener(callback);
  }

  removeListener(callback) {
    super.removeListener(callback);
  }

  process(e) {
    const syncTime = this.como.experience.plugins['sync'].getSyncTime();

    // metas
    this.data.metas.id = this.streamId;
    this.data.metas.time = syncTime;
    this.data.metas.period = e.interval / 1000;
    // acceleration
    this.data.accelerationIncludingGravity.x = e.accelerationIncludingGravity.x;
    this.data.accelerationIncludingGravity.y = e.accelerationIncludingGravity.y;
    this.data.accelerationIncludingGravity.z = e.accelerationIncludingGravity.z;
    // rotation
    this.data.rotationRate.alpha = e.rotationRate.alpha;
    this.data.rotationRate.beta = e.rotationRate.beta;
    this.data.rotationRate.gamma = e.rotationRate.gamma;

    this.emit(this.data);
  }
}

export default ComoteSource;

