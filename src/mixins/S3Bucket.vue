<script>
export default {
  name: "S3Bucket",
  data() {
    return {
      s3Bucket: undefined,
    };
  },
  methods: {
    updateS3Bucket: function(s3uri) {
      this.s3Bucket = undefined;
      if (s3uri) {
        const substring = s3uri.split("//")[1];
        if (substring) {
          this.s3Bucket = substring.split("/")[0];
          return;
        }
      }
    },
    getS3Args: function() {
      if (this.s3Bucket) {
        return `?s3BucketName=${this.s3Bucket}`
      }
      return "";
    },
  },

};
</script>


