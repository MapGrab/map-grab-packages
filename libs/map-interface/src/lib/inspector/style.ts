export const inspectorStyle = `
  dialog::backdrop {
    background-color: rgba(200, 200, 200, 0.3);
  }

  .VV_inspector_container {
    dialog {
      max-height: 70vh;
      font-family: Tahoma;
      border-radius: 10px;
      box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
      padding: 10px;
      max-width: 450px;
      margin: 0;
      background-color: #fff;
      border: none;
      overflow: auto;
      min-width: 300px;

      .close-button {
        position: absolute;
        right: 10px;
        top: 10px;
        fill: #2830A2;
        cursor: pointer;
        display: none;
      }

      &.freeze {
        .close-button {
          display: block;
        }
      }
    
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      li {
        margin: 2px 0;
        display: flex;
        align-items: center;

        > div {
          display: flex;
          align-items: center;
          background-color: #F4F4F6;
          border-radius: 4px;
          padding: 3px 6px;
          font-size: 14px;
          font-weight: bold;
        }
      }
    
      label {
        cursor: pointer;
        margin-left: 4px;

        .pre {
          color: #37363C;
        }

        .val {
          color: #2830A2;
        }
      }

      .selector-text {
        display: flex;
        align-items: center;

        p {
          padding: 4px 8px;
          background-color: #FAFAFA;
          border: 1px solid #C8C7CC;
          border-radius: 10px;
          min-height: 35px;
          display: flex;
          align-items: center;
        }

        svg {
          margin-left: 8px;
          padding: 5px;
          min-width: 30px;
          background-color: #FAFAFA;
          border: 1px solid #C8C7CC;
          border-radius: 10px;
          fill: #434CE6;

          &:hover {
            background-color: #fafafa;
          }
        }
      }
    }
  }
`;
